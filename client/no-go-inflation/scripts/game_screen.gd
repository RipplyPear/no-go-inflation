extends Node2D

@onready var map_root: MapRoot = $MapRoot
@onready var building_popup: BuildingPopup = $BuildingPopup

@onready var time_label: Label = $HUD/TopPanel/MarginContainer/VBoxContainer/TimeLabel
@onready var resource_label: Label = $HUD/TopPanel/MarginContainer/VBoxContainer/ResourceLabel

@onready var market_popup: MarketPopup = $MarketPopup
@onready var open_market_button: Button = $HUD/TopPanel/MarginContainer/VBoxContainer/OpenMarketButton

const DEV_SEED_PRICES := [5, 7, 9, 12]

var dev_seed_price_index := 0
var dev_seed_button: Button

func _ready() -> void:
	map_root.tile_clicked.connect(_on_tile_clicked)
	
	building_popup.build_requested.connect(_on_build_requested)
	building_popup.upgrade_requested.connect(_on_upgrade_requested)
	building_popup.collect_requested.connect(_on_collect_requested)
	
	if not GameSocket.message_received.is_connected(_on_ws_message_received):
		GameSocket.message_received.connect(_on_ws_message_received)
		
	open_market_button.pressed.connect(_on_open_market_pressed)
	market_popup.create_offer_requested.connect(_on_create_offer_requested)
	market_popup.accept_offer_requested.connect(_on_accept_offer_requested)
	
	if OS.is_debug_build():
		dev_seed_button = Button.new()
		dev_seed_button.text = "DEV: ofertă bot (%d galbeni)" % DEV_SEED_PRICES[dev_seed_price_index]
		dev_seed_button.pressed.connect(_on_dev_seed_bot_offer_pressed)
		$HUD/TopPanel/MarginContainer/VBoxContainer.add_child(dev_seed_button)
		
		var dev_finish_button := Button.new()
		dev_finish_button.text = "DEV: finalizează sesiunea"
		dev_finish_button.pressed.connect(_on_dev_force_finish_pressed)
		$HUD/TopPanel/MarginContainer/VBoxContainer.add_child(dev_finish_button)
	
	_update_hud_from_game_state()

func _on_dev_seed_bot_offer_pressed() -> void:
	if GameState.session_id.is_empty():
		print("Nu există sesiune activă pentru oferta de test.")
		return

	var price: int = DEV_SEED_PRICES[dev_seed_price_index]

	GameSocket.send_message("DEV_SEED_BOT_OFFER", {
		"sessionId": GameState.session_id,
		"offerType": "sell",
		"resource": "wood",
		"quantity": 100,
		"pricePerUnit": price
	})

	print("DEV_SEED_BOT_OFFER trimis cu preț %d." % price)

	dev_seed_price_index = (dev_seed_price_index + 1) % DEV_SEED_PRICES.size()

	if dev_seed_button != null:
		dev_seed_button.text = "DEV: ofertă bot (%d galbeni)" % DEV_SEED_PRICES[dev_seed_price_index]

func _on_accept_offer_requested(offer_id: String, quantity: int) -> void:
	if GameState.session_id.is_empty():
		print("Nu există sesiune activă pentru acceptarea ofertei.")
		return

	GameSocket.send_message("ACCEPT_MARKET_OFFER", {
		"sessionId": GameState.session_id,
		"offerId": offer_id,
		"quantity": quantity
	})

	print("ACCEPT_MARKET_OFFER trimis pentru oferta %s, cantitate %d" % [
		offer_id,
		quantity
	])

func _on_dev_force_finish_pressed() -> void:
	if GameState.session_id.is_empty():
		print("Nu există sesiune activă pentru finalizare.")
		return

	GameSocket.send_message("DEV_FORCE_FINISH_SESSION", {
		"sessionId": GameState.session_id
	})

	print("DEV_FORCE_FINISH_SESSION trimis.")

func _update_hud_from_game_state() -> void:
	time_label.text = _format_time_label(
		GameState.current_day,
		GameState.current_minute
	)

	var resources := GameState.resources
	var economy := GameState.economy

	var wood := int(resources.get("wood", 0))
	var stone := int(resources.get("stone", 0))
	var grain := int(resources.get("grain", 0))
	var galbeni := int(resources.get("galbeni", 0))
	var inflation := int(economy.get("inflation", 20))

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


func _on_tile_clicked(x: int, y: int, tile_type: String) -> void:
	var building: Dictionary = map_root.get_building_at(x, y)
	building_popup.show_for_selection(x, y, tile_type, building)


func _on_build_requested(x: int, y: int, _tile_type: String) -> void:
	_send_tile_action("BUILD_BUILDING", x, y)


func _on_upgrade_requested(x: int, y: int) -> void:
	_send_tile_action("UPGRADE_BUILDING", x, y)


func _on_collect_requested(x: int, y: int) -> void:
	_send_tile_action("COLLECT_BUILDING", x, y)

func _on_ws_message_received(message: Dictionary) -> void:
	var message_type := str(message.get("type", ""))

	if message_type == "SESSION_STATE":
		var payload = message.get("payload", {})

		if typeof(payload) != TYPE_DICTIONARY:
			print("SESSION_STATE invalid primit în GameScreen.")
			return

		GameState.load_session_state(payload)
		map_root.apply_server_state(GameState.map_data, GameState.buildings)
		_update_hud_from_game_state()

	elif message_type == "MARKET_STATE":
		var payload = message.get("payload", {})

		if typeof(payload) != TYPE_DICTIONARY:
			print("MARKET_STATE invalid primit în GameScreen.")
			return

		market_popup.set_market_state(payload)

	elif message_type == "OFFER_CREATED":
		print("Oferta a fost creată.")

	elif message_type == "TRADE_COMPLETED":
		print("Tranzacție finalizată.")
	
	elif message_type == "DEV_BOT_OFFER_CREATED":
		print("Oferta botului de test a fost creată.")

		if not GameState.session_id.is_empty():
			GameSocket.send_message("GET_MARKET_STATE", {
				"sessionId": GameState.session_id
			})
	
	elif message_type == "GAME_FINISHED":
		var payload = message.get("payload", {})

		if typeof(payload) != TYPE_DICTIONARY:
			print("GAME_FINISHED invalid primit în GameScreen.")
			return

		_show_game_finished(payload)
	
	elif message_type == "ERROR":
		var payload: Dictionary = message.get("payload", {})
		print("Server error: ", payload.get("message", "Eroare necunoscută."))
		
func _send_tile_action(message_type: String, x: int, y: int) -> void:
	if GameState.session_id.is_empty():
		print("Nu există sesiune activă pentru acțiunea: ", message_type)
		return

	GameSocket.send_message(message_type, {
		"sessionId": GameState.session_id,
		"x": x,
		"y": y
	})

	print("%s trimis către server pentru (%d, %d)" % [message_type, x, y])
	
func _on_open_market_pressed() -> void:
	market_popup.show_popup()

	if GameState.session_id.is_empty():
		print("Nu există sesiune activă pentru piață.")
		return

	GameSocket.send_message("GET_MARKET_STATE", {
		"sessionId": GameState.session_id
	})


func _on_create_offer_requested(
	offer_type: String,
	resource: String,
	amount: int,
	price: int
) -> void:
	if GameState.session_id.is_empty():
		print("Nu există sesiune activă pentru crearea ofertei.")
		return

	GameSocket.send_message("CREATE_MARKET_OFFER", {
		"sessionId": GameState.session_id,
		"offerType": offer_type,
		"resource": resource,
		"quantity": amount,
		"pricePerUnit": price
	})

	print("CREATE_MARKET_OFFER trimis: %s %d %s la %d galbeni/unitate" % [
		offer_type,
		amount,
		resource,
		price
	])
	
	
func _show_game_finished(final_result: Dictionary) -> void:
	var collective_result := str(final_result.get("collectiveResult", "loss"))
	var final_inflation := int(final_result.get("finalInflation", 0))
	var average_score := int(final_result.get("averageEconomicScore", 0))
	var results = final_result.get("results", [])

	var result_label := "VICTORIE" if collective_result == "win" else "ÎNFRÂNGERE"

	var text := "Final de joc: %s\n" % result_label
	text += "Inflație finală: %d\n" % final_inflation
	text += "Scor economic mediu: %d\n\n" % average_score
	text += "Rezultate jucători:\n"

	if typeof(results) == TYPE_ARRAY:
		for result in results:
			if typeof(result) != TYPE_DICTIONARY:
				continue

			text += "- %s | scor: %d | rang: %s | tranzacții: %d | valoare: %d\n" % [
				str(result.get("displayName", "Jucător")),
				int(result.get("economicScore", 0)),
				str(result.get("rank", "D")),
				int(result.get("tradesCount", 0)),
				int(result.get("totalTradedValue", 0))
			]

	var dialog := AcceptDialog.new()
	dialog.title = "Rezultatul sesiunii"
	dialog.dialog_text = text
	add_child(dialog)
	dialog.popup_centered()
