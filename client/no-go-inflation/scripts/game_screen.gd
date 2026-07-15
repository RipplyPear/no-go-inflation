extends Node2D

@onready var map_root: MapRoot = $MapRoot
@onready var building_popup: BuildingPopup = $BuildingPopup
@onready var time_label: Label = $HUD/TopPanel/MarginContainer/VBoxContainer/TimeLabel
@onready var resource_label: Label = $HUD/TopPanel/MarginContainer/VBoxContainer/ResourceLabel
@onready var market_popup: MarketPopup = $MarketPopup
@onready var open_market_button: Button = $HUD/TopPanel/MarginContainer/VBoxContainer/OpenMarketButton
@onready var leave_game_button: Button = $HUD/LeaveGameButton
@onready var leave_game_dialog: ConfirmationDialog = $LeaveGameDialog

var dev_panel: GameDevPanel
var end_game_dialog: EndGameDialog
var _returning_to_player_menu := false

const SHOW_DEV_CONTROLS := false
const SCREEN_SIZE := Vector2(1280, 720)


func _ready() -> void:
	_position_map_root()
	map_root.tile_clicked.connect(_on_tile_clicked)
	building_popup.build_requested.connect(_on_build_requested)
	building_popup.upgrade_requested.connect(_on_upgrade_requested)
	building_popup.collect_requested.connect(_on_collect_requested)
	if not GameSocket.message_received.is_connected(_on_ws_message_received):
		GameSocket.message_received.connect(_on_ws_message_received)
	if not GameState.state_changed.is_connected(_on_game_state_changed):
		GameState.state_changed.connect(_on_game_state_changed)
	open_market_button.pressed.connect(_on_open_market_pressed)
	leave_game_button.pressed.connect(_on_leave_game_pressed)
	leave_game_dialog.confirmed.connect(_on_leave_game_confirmed)
	market_popup.create_offer_requested.connect(_on_create_offer_requested)
	market_popup.accept_offer_requested.connect(_on_accept_offer_requested)
	market_popup.cancel_offer_requested.connect(_on_cancel_offer_requested)
	market_popup.recycle_requested.connect(_on_recycle_requested)
	_setup_debug_buttons()
	_setup_end_game_dialog()
	_on_game_state_changed()


func _exit_tree() -> void:
	if GameSocket.message_received.is_connected(_on_ws_message_received):
		GameSocket.message_received.disconnect(_on_ws_message_received)
	if GameState.state_changed.is_connected(_on_game_state_changed):
		GameState.state_changed.disconnect(_on_game_state_changed)


func _position_map_root() -> void:
	var dimensions := _get_current_map_dimensions()
	if dimensions.x <= 0 or dimensions.y <= 0:
		return
	var map_size := Vector2(dimensions.x * MapRoot.TILE_SIZE.x, dimensions.y * MapRoot.TILE_SIZE.y)
	map_root.position = Vector2(
		floor(((SCREEN_SIZE - map_size) / 2.0).x / MapRoot.TILE_SIZE.x) * MapRoot.TILE_SIZE.x,
		round(((SCREEN_SIZE - map_size) / 2.0).y / MapRoot.TILE_SIZE.y) * MapRoot.TILE_SIZE.y,
	)


func _get_current_map_dimensions() -> Vector2i:
	var data: Dictionary = GameState.map_data if not GameState.map_data.is_empty() else map_root.map_data
	var width := int(data.get("width", 0))
	var height := int(data.get("height", 0))
	if (width <= 0 or height <= 0) and data.has("tiles") and typeof(data["tiles"]) == TYPE_ARRAY:
		var rows: Array = data["tiles"]
		height = rows.size()
		for row in rows:
			if typeof(row) == TYPE_ARRAY:
				width = max(width, row.size())
	return Vector2i(width, height)


func _setup_end_game_dialog() -> void:
	end_game_dialog = EndGameDialog.new()
	end_game_dialog.confirmed.connect(_return_to_player_menu)
	add_child(end_game_dialog)


func _on_game_state_changed() -> void:
	_position_map_root()
	_update_hud_from_game_state()
	map_root.apply_server_state(GameState.map_data, GameState.buildings)
	market_popup.refresh_player_state()


func _update_hud_from_game_state() -> void:
	time_label.text = _format_time_label(GameState.current_day, GameState.current_minute)
	resource_label.text = tr("GAME_RESOURCES").format({
		"wood": GameState.get_resource_amount(GameDomain.RESOURCE_WOOD),
		"stone": GameState.get_resource_amount(GameDomain.RESOURCE_STONE),
		"grain": GameState.get_resource_amount(GameDomain.RESOURCE_GRAIN),
		"gold": GameState.get_resource_amount(GameDomain.RESOURCE_GALBENI),
		"inflation": GameState.get_inflation(),
	})


func _format_time_label(day: int, minute: int) -> String:
	return tr("GAME_TIME").format({"day": day, "time": "%02d:%02d" % [floori(float(minute) / 60.0), minute % 60]})


func _on_tile_clicked(x: int, y: int, tile_type: String) -> void:
	building_popup.show_for_selection(x, y, tile_type, map_root.get_building_at(x, y), map_root.position)


func _on_build_requested(x: int, y: int, _tile_type: String) -> void:
	_send_tile_action(WsMessageType.BUILD_BUILDING, x, y)


func _on_upgrade_requested(x: int, y: int) -> void:
	_send_tile_action(WsMessageType.UPGRADE_BUILDING, x, y)


func _on_collect_requested(x: int, y: int) -> void:
	_send_tile_action(WsMessageType.COLLECT_BUILDING, x, y)


func _on_open_market_pressed() -> void:
	market_popup.show_popup()
	_request_market_state()


func _request_market_state() -> void:
	_send_session_message(WsMessageType.GET_MARKET_STATE, {}, tr("GAME_MARKET_REQUEST"))


func _on_create_offer_requested(offer_type: String, resource: String, amount: int, price: int) -> void:
	_send_session_message(WsMessageType.CREATE_MARKET_OFFER, {"offerType": offer_type, "resource": resource, "quantity": amount, "pricePerUnit": price}, tr("GAME_OFFER_CREATION"))


func _on_accept_offer_requested(offer_id: String, quantity: int) -> void:
	_send_session_message(WsMessageType.ACCEPT_MARKET_OFFER, {"offerId": offer_id, "quantity": quantity}, tr("GAME_OFFER_ACCEPTANCE"))


func _on_cancel_offer_requested(offer_id: String) -> void:
	_send_session_message(WsMessageType.CANCEL_MARKET_OFFER, {"offerId": offer_id}, tr("GAME_OFFER_CANCELLATION"))


func _on_recycle_requested(resource: String, quantity: int) -> void:
	if _send_session_message(WsMessageType.RECYCLE_RESOURCE, {"resource": resource, "quantity": quantity}, tr("GAME_RECYCLING")):
		_show_status(tr("GAME_RECYCLE_REQUEST_SENT"))


func _on_leave_game_pressed() -> void:
	if GameState.session_id.is_empty():
		_return_to_player_menu()
		return
	leave_game_dialog.popup_centered(Vector2i(420, 140))


func _on_leave_game_confirmed() -> void:
	if GameState.session_id.is_empty():
		_return_to_player_menu()
		return
	leave_game_button.disabled = true
	if _send_session_message(WsMessageType.LEAVE_SESSION, {}, tr("GAME_SESSION_LEAVE")):
		_show_status(tr("GAME_LEAVING_SESSION"))
		await get_tree().process_frame
		_return_to_player_menu()
	else:
		leave_game_button.disabled = false


func _on_ws_message_received(message: Dictionary) -> void:
	var message_type := str(message.get("type", ""))
	match message_type:
		WsMessageType.SESSION_STATE:
			var session_payload := _get_payload_dictionary(message, message_type)
			if not session_payload.is_empty(): GameState.load_session_state(session_payload)
		WsMessageType.MARKET_STATE:
			var market_payload := _get_payload_dictionary(message, message_type)
			if not market_payload.is_empty(): market_popup.set_market_state(market_payload)
		WsMessageType.OFFER_CREATED:
			_show_status(tr("GAME_OFFER_CREATED")); _request_market_state()
		WsMessageType.OFFER_CANCELLED:
			_show_status(tr("GAME_OFFER_CANCELLED")); _request_market_state()
		WsMessageType.TRADE_COMPLETED:
			_show_status(tr("GAME_TRADE_COMPLETED")); _request_market_state()
		WsMessageType.DEV_BOT_OFFER_CREATED:
			_show_status(tr("DEV_BOT_OFFER_CREATED")); _request_market_state()
		WsMessageType.RESOURCE_RECYCLED:
			_handle_resource_recycled(message)
		WsMessageType.GAME_FINISHED:
			var result := _get_payload_dictionary(message, message_type)
			if not result.is_empty(): end_game_dialog.show_results(result)
		WsMessageType.SESSION_CANCELLED:
			_show_status(tr("GAME_SESSION_CANCELLED")); _return_to_player_menu()
		WsMessageType.SESSION_LEFT:
			_return_to_player_menu()
		WsMessageType.ERROR:
			_handle_error_message(message)
		_:
			_show_status(tr("GAME_UNHANDLED_WS_MESSAGE").format({"message_type": message_type}))


func _handle_resource_recycled(message: Dictionary) -> void:
	var payload := _get_payload_dictionary(message, WsMessageType.RESOURCE_RECYCLED)
	if not payload.is_empty():
		_show_status(tr("GAME_RECYCLED").format({"quantity": int(payload.get("quantity", 0)), "gold": int(payload.get("galbeniGained", 0))}))


func _handle_error_message(message: Dictionary) -> void:
	var payload = message.get("payload", {})
	if typeof(payload) != TYPE_DICTIONARY:
		_show_status(tr("GAME_SERVER_UNKNOWN_ERROR"))
		return
	var translated_error := _translate_error_payload(payload)
	if str(payload.get("context", "")) == WsMessageType.ACCEPT_MARKET_OFFER and market_popup != null:
		var offer_id := str(payload.get("offerId", ""))
		if not offer_id.is_empty():
			market_popup.show_offer_error(offer_id, translated_error)
			return
	_show_status(translated_error)


func _translate_error_payload(payload: Dictionary) -> String:
	var code := str(payload.get("code", ""))
	var translated := tr(code)
	if code.is_empty() or translated == code:
		return tr("GAME_SERVER_UNKNOWN_ERROR")
	var params = payload.get("params", {})
	return translated.format(_normalize_params(params) if typeof(params) == TYPE_DICTIONARY else {})


func _normalize_params(params: Dictionary) -> Dictionary:
	var normalized := {}
	for key in params:
		var value = params[key]
		normalized[key] = int(value) if typeof(value) == TYPE_FLOAT and is_equal_approx(value, round(value)) else value
	return normalized


func _get_payload_dictionary(message: Dictionary, message_type: String) -> Dictionary:
	var payload = message.get("payload", {})
	if typeof(payload) != TYPE_DICTIONARY:
		_show_status(tr("GAME_INVALID_WS_PAYLOAD").format({"message_type": message_type}))
		return {}
	return payload


func _send_tile_action(message_type: String, x: int, y: int) -> void:
	_send_session_message(message_type, {"x": x, "y": y}, tr("GAME_MAP_ACTION"))


func _has_active_session_or_warn(action_label: String) -> bool:
	if GameState.has_active_session():
		return true
	_show_status(tr("GAME_NO_ACTIVE_SESSION").format({"action": action_label}))
	return false


func _send_session_message(message_type: String, payload: Dictionary, action_label: String) -> bool:
	if not _has_active_session_or_warn(action_label):
		return false
	var full_payload := payload.duplicate()
	full_payload["sessionId"] = GameState.session_id
	if not GameSocket.send_message(message_type, full_payload):
		_show_status(tr("GAME_MESSAGE_SEND_FAILED").format({"action": action_label}))
		return false
	return true


func _show_status(message: String) -> void:
	print(message)


func _return_to_player_menu() -> void:
	if _returning_to_player_menu:
		return
	_returning_to_player_menu = true
	if GameSocket.message_received.is_connected(_on_ws_message_received): GameSocket.message_received.disconnect(_on_ws_message_received)
	if GameState.state_changed.is_connected(_on_game_state_changed): GameState.state_changed.disconnect(_on_game_state_changed)
	GameState.reset()
	get_tree().call_deferred("change_scene_to_file", "res://scenes/PlayerMenuScreen.tscn")


func _setup_debug_buttons() -> void:
	if not SHOW_DEV_CONTROLS or not OS.is_debug_build():
		return
	dev_panel = GameDevPanel.new()
	dev_panel.seed_bot_offer_requested.connect(_on_dev_seed_bot_offer_requested)
	dev_panel.force_finish_requested.connect(_on_dev_force_finish_requested)
	$HUD/TopPanel/MarginContainer/VBoxContainer.add_child(dev_panel)


func _on_dev_seed_bot_offer_requested(price: int) -> void:
	if _send_session_message(WsMessageType.DEV_SEED_BOT_OFFER, {"offerType": GameDomain.OFFER_SELL, "resource": GameDomain.RESOURCE_WOOD, "quantity": 100, "pricePerUnit": price}, tr("GAME_OFFER_CREATION")):
		_show_status(tr("DEV_BOT_OFFER_SENT").format({"price": price}))
		dev_panel.advance_seed_price()


func _on_dev_force_finish_requested() -> void:
	if _send_session_message(WsMessageType.DEV_FORCE_FINISH_SESSION, {}, tr("GAME_SESSION_LEAVE")):
		_show_status(tr("DEV_FINISH_SENT"))
