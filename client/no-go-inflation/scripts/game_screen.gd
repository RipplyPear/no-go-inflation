extends Node2D

@onready var map_root: MapRoot = $MapRoot
@onready var building_popup: BuildingPopup = $BuildingPopup

@onready var time_label: Label = $HUD/TopPanel/MarginContainer/VBoxContainer/TimeLabel
@onready var resource_label: Label = $HUD/TopPanel/MarginContainer/VBoxContainer/ResourceLabel

@onready var market_popup: MarketPopup = $MarketPopup
@onready var open_market_button: Button = $HUD/TopPanel/MarginContainer/VBoxContainer/OpenMarketButton

var dev_panel: GameDevPanel
var end_game_dialog: EndGameDialog

const SHOW_DEV_CONTROLS := false

func _ready() -> void:
	map_root.tile_clicked.connect(_on_tile_clicked)
	
	building_popup.build_requested.connect(_on_build_requested)
	building_popup.upgrade_requested.connect(_on_upgrade_requested)
	building_popup.collect_requested.connect(_on_collect_requested)
	
	if not GameSocket.message_received.is_connected(_on_ws_message_received):
		GameSocket.message_received.connect(_on_ws_message_received)
	
	if not GameState.state_changed.is_connected(_on_game_state_changed):
		GameState.state_changed.connect(_on_game_state_changed)
		
	open_market_button.pressed.connect(_on_open_market_pressed)
	market_popup.create_offer_requested.connect(_on_create_offer_requested)
	market_popup.accept_offer_requested.connect(_on_accept_offer_requested)
	
	_setup_debug_buttons()
	_setup_end_game_dialog()
	
	_on_game_state_changed()


func _setup_end_game_dialog() -> void:
	end_game_dialog = EndGameDialog.new()
	add_child(end_game_dialog)


func _on_game_state_changed() -> void:
	_update_hud_from_game_state()
	map_root.apply_server_state(GameState.map_data, GameState.buildings)
	market_popup.refresh_player_state()


func _on_dev_seed_bot_offer_requested(price: int) -> void:
	var sent := _send_session_message(WsMessageType.DEV_SEED_BOT_OFFER, {
		"offerType": GameDomain.OFFER_SELL,
		"resource": GameDomain.RESOURCE_WOOD,
		"quantity": 100,
		"pricePerUnit": price
	}, "oferta de test")
	
	if not sent:
		return
	
	_show_status("DEV_SEED_BOT_OFFER trimis cu preț %d." % price)
	
	if dev_panel != null:
		dev_panel.advance_seed_price()


func _on_accept_offer_requested(offer_id: String, quantity: int) -> void:
	if _send_session_message(WsMessageType.ACCEPT_MARKET_OFFER, {
		"offerId": offer_id,
		"quantity": quantity
	}, "acceptarea ofertei"):
		_show_status("ACCEPT_MARKET_OFFER trimis pentru oferta %s, cantitate %d" % [
			offer_id,
			quantity
		])


func _on_dev_force_finish_requested() -> void:
	if _send_session_message(WsMessageType.DEV_FORCE_FINISH_SESSION, {}, "finalizare"):
		_show_status("DEV_FORCE_FINISH_SESSION trimis.")


func _update_hud_from_game_state() -> void:
	time_label.text = _format_time_label(
		GameState.current_day,
		GameState.current_minute
	)
	
	var wood := GameState.get_resource_amount(GameDomain.RESOURCE_WOOD)
	var stone := GameState.get_resource_amount(GameDomain.RESOURCE_STONE)
	var grain := GameState.get_resource_amount(GameDomain.RESOURCE_GRAIN)
	var galbeni := GameState.get_resource_amount(GameDomain.RESOURCE_GALBENI)
	var inflation := GameState.get_inflation()
	
	resource_label.text = "Lemn: %d | Piatră: %d | Grâne: %d | Galbeni: %d | Inflație: %d" % [
		wood,
		stone,
		grain,
		galbeni,
		inflation
	]


func _format_time_label(day: int, minute: int) -> String:
	var day_names := {
		1: "Luni",
		2: "Marți",
		3: "Miercuri",
		4: "Joi",
		5: "Vineri",
	}
	
	var hour := floori(float(minute) / 60.0)
	var min_part := minute % 60
	var day_label := str(day_names.get(day, "Ziua %d" % day))
	
	return "%s - %02d:%02d" % [day_label, hour, min_part]


func _request_market_state() -> void:
	_send_session_message(WsMessageType.GET_MARKET_STATE, {}, "piață")


func _on_tile_clicked(x: int, y: int, tile_type: String) -> void:
	var building: Dictionary = map_root.get_building_at(x, y)
	building_popup.show_for_selection(x, y, tile_type, building)


func _on_build_requested(x: int, y: int, _tile_type: String) -> void:
	_send_tile_action(WsMessageType.BUILD_BUILDING, x, y)


func _on_upgrade_requested(x: int, y: int) -> void:
	_send_tile_action(WsMessageType.UPGRADE_BUILDING, x, y)


func _on_collect_requested(x: int, y: int) -> void:
	_send_tile_action(WsMessageType.COLLECT_BUILDING, x, y)


func _on_ws_message_received(message: Dictionary) -> void:
	var message_type := str(message.get("type", ""))
	
	match message_type:
		WsMessageType.SESSION_STATE:
			_handle_session_state_message(message)
		
		WsMessageType.MARKET_STATE:
			_handle_market_state_message(message)
		
		WsMessageType.OFFER_CREATED:
			_handle_offer_created_message()
		
		WsMessageType.TRADE_COMPLETED:
			_handle_trade_completed_message()
		
		WsMessageType.DEV_BOT_OFFER_CREATED:
			_handle_dev_bot_offer_created_message()
		
		WsMessageType.GAME_FINISHED:
			_handle_game_finished_message(message)
		
		WsMessageType.ERROR:
			_handle_error_message(message)
		
		_:
			_show_status("Mesaj WebSocket netratat în GameScreen: %s" % message_type)


func _handle_session_state_message(message: Dictionary) -> void:
	var payload = _get_payload_dictionary(message, WsMessageType.SESSION_STATE)
	
	if payload.is_empty():
		return
	
	GameState.load_session_state(payload)


func _handle_market_state_message(message: Dictionary) -> void:
	var payload = _get_payload_dictionary(message, WsMessageType.MARKET_STATE)
	
	if payload.is_empty():
		return
	
	market_popup.set_market_state(payload)


func _handle_offer_created_message() -> void:
	_show_status("Oferta a fost creată.")
	_request_market_state()


func _handle_trade_completed_message() -> void:
	_show_status("Tranzacție finalizată.")
	_request_market_state()


func _handle_dev_bot_offer_created_message() -> void:
	_show_status("Oferta botului de test a fost creată.")
	_request_market_state()


func _handle_game_finished_message(message: Dictionary) -> void:
	var payload = _get_payload_dictionary(message, WsMessageType.GAME_FINISHED)
	
	if payload.is_empty():
		return
	
	_show_game_finished(payload)


func _handle_error_message(message: Dictionary) -> void:
	var payload = message.get("payload", {})
	
	if typeof(payload) != TYPE_DICTIONARY:
		_show_status("Server error: Eroare necunoscută.")
		return
	
	_show_status("Server error: %s" % str(payload.get("message", "Eroare necunoscută.")))


func _get_payload_dictionary(message: Dictionary, message_type: String) -> Dictionary:
	var payload = message.get("payload", {})
	
	if typeof(payload) != TYPE_DICTIONARY:
		_show_status("%s invalid primit în GameScreen." % message_type)
		return {}
	
	return payload


func _send_tile_action(message_type: String, x: int, y: int) -> void:
	_send_session_message(message_type, {
		"x": x,
		"y": y
	}, "acțiunea pe hartă")


func _on_open_market_pressed() -> void:
	market_popup.show_popup()
	_request_market_state()


func _on_create_offer_requested(
	offer_type: String,
	resource: String,
	amount: int,
	price: int
) -> void:
	var sent := _send_session_message(WsMessageType.CREATE_MARKET_OFFER, {
		"offerType": offer_type,
		"resource": resource,
		"quantity": amount,
		"pricePerUnit": price
	}, "crearea ofertei")
	
	if not sent:
		return
	
	_show_status("%s trimis: %s %d %s la %d galbeni/unitate" % [
		WsMessageType.CREATE_MARKET_OFFER,
		offer_type,
		amount,
		resource,
		price
	])


func _show_game_finished(final_result: Dictionary) -> void:
	end_game_dialog.show_results(final_result)

func _has_active_session_or_warn(action_label: String) -> bool:
	if GameState.has_active_session():
		return true
	
	_show_status("Nu există sesiune activă pentru %s." % action_label)
	return false


func _show_status(message: String) -> void:
	print(message)


func _send_session_message(
	message_type: String,
	payload: Dictionary,
	action_label: String
) -> bool:
	if not _has_active_session_or_warn(action_label):
		return false
	
	var full_payload := payload.duplicate()
	full_payload["sessionId"] = GameState.session_id
	
	var sent := GameSocket.send_message(message_type, full_payload)
	
	if not sent:
		_show_status("Nu s-a putut trimite mesajul pentru %s." % action_label)
		return false
	
	return true


func _setup_debug_buttons() -> void:
	# Debug-only controls used for local testing and demos.
	# Keep disabled for normal gameplay / presentation.
	if not SHOW_DEV_CONTROLS:
		return
	
	if not OS.is_debug_build():
		return
	
	dev_panel = GameDevPanel.new()
	dev_panel.seed_bot_offer_requested.connect(_on_dev_seed_bot_offer_requested)
	dev_panel.force_finish_requested.connect(_on_dev_force_finish_requested)
	
	$HUD/TopPanel/MarginContainer/VBoxContainer.add_child(dev_panel)
