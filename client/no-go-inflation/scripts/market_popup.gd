class_name MarketPopup
extends CanvasLayer

signal create_offer_requested(offer_type: String, resource: String, amount: int, price: int)
signal accept_offer_requested(offer_id: String, quantity: int)

const OFFER_TYPES := ["buy", "sell"]
const RESOURCES := ["wood", "stone", "grain"]

@onready var panel: PanelContainer = $PanelContainer

@onready var type_option: OptionButton = $PanelContainer/MarginContainer/HBoxContainer/CreatePanel/TypeOption
@onready var resource_option: OptionButton = $PanelContainer/MarginContainer/HBoxContainer/CreatePanel/ResourceOption
@onready var amount_spin: SpinBox = $PanelContainer/MarginContainer/HBoxContainer/CreatePanel/AmountSpin
@onready var price_spin: SpinBox = $PanelContainer/MarginContainer/HBoxContainer/CreatePanel/PriceSpin
@onready var create_button: Button = $PanelContainer/MarginContainer/HBoxContainer/CreatePanel/CreateButton
@onready var close_button: Button = $PanelContainer/MarginContainer/HBoxContainer/CreatePanel/CloseButton

@onready var offer_list: VBoxContainer = $PanelContainer/MarginContainer/HBoxContainer/OffersPanel/OfferList
@onready var player_state_title: Label = $PanelContainer/MarginContainer/HBoxContainer/PlayerStatePanel/PlayerStateTitle
@onready var player_state_label: Label = $PanelContainer/MarginContainer/HBoxContainer/PlayerStatePanel/PlayerStateLabel


func _ready() -> void:
	panel.visible = false

	amount_spin.min_value = 1
	amount_spin.max_value = 999
	amount_spin.value = 10
	amount_spin.step = 1

	price_spin.min_value = 1
	price_spin.max_value = 999
	price_spin.value = 1
	price_spin.step = 1

	create_button.pressed.connect(_on_create_pressed)
	close_button.pressed.connect(hide_popup)

	player_state_title.text = "Starea jucătorului"
	_update_player_state()


func show_popup() -> void:
	_update_player_state()
	panel.visible = true


func hide_popup() -> void:
	panel.visible = false


func _update_player_state() -> void:
	_update_side_panel({})
	var resources := GameState.resources

	player_state_label.text = "Lemn: %d\nPiatră: %d\nGrâne: %d\nGalbeni: %d" % [
		int(resources.get("wood", 0)),
		int(resources.get("stone", 0)),
		int(resources.get("grain", 0)),
		int(resources.get("galbeni", 0))
	]


func _on_create_pressed() -> void:
	var offer_type: String = OFFER_TYPES[type_option.selected]
	var resource: String = RESOURCES[resource_option.selected]
	var amount := int(amount_spin.value)
	var price := int(price_spin.value)

	create_offer_requested.emit(offer_type, resource, amount, price)

func set_market_state(market_state: Dictionary) -> void:
	_update_side_panel(market_state)

	for child in offer_list.get_children():
		child.queue_free()

	var offers = market_state.get("offers", [])

	if typeof(offers) != TYPE_ARRAY or offers.is_empty():
		var empty_label := Label.new()
		empty_label.text = "Nu există oferte active."
		offer_list.add_child(empty_label)
		return

	for offer in offers:
		if typeof(offer) != TYPE_DICTIONARY:
			continue

		var row := HBoxContainer.new()

		var offer_id := str(offer.get("id", ""))
		var offer_type := str(offer.get("offerType", ""))
		var resource := str(offer.get("resource", ""))
		var remaining := int(offer.get("remainingQuantity", 0))
		var min_quantity := int(offer.get("minQuantity", 1))
		var price := int(offer.get("pricePerUnit", 0))
		var creator := str(offer.get("creatorName", "unknown"))
		var is_own_offer := bool(offer.get("isOwnOffer", false))

		var label := Label.new()
		label.text = "%s %s | rămas: %d | preț: %d | de la: %s" % [
			offer_type,
			resource,
			remaining,
			price,
			creator
		]
		row.add_child(label)

		var quantity_spin := SpinBox.new()
		quantity_spin.min_value = max(1, min_quantity)
		quantity_spin.max_value = max(1, remaining)
		quantity_spin.value = quantity_spin.min_value
		quantity_spin.step = 1
		row.add_child(quantity_spin)

		var accept_button := Button.new()
		accept_button.text = "Acceptă"
		accept_button.disabled = is_own_offer or offer_id.is_empty() or remaining <= 0

		accept_button.pressed.connect(func() -> void:
			accept_offer_requested.emit(offer_id, int(quantity_spin.value))
		)

		row.add_child(accept_button)
		offer_list.add_child(row)
		
		
func _update_side_panel(market_state: Dictionary) -> void:
	var resources := GameState.resources

	var wood := int(resources.get("wood", 0))
	var stone := int(resources.get("stone", 0))
	var grain := int(resources.get("grain", 0))
	var galbeni := int(resources.get("galbeni", 0))

	var economy: Dictionary = market_state.get("economy", GameState.economy)
	var average_prices: Dictionary = economy.get("averagePrices", {})

	var inflation := int(economy.get("inflation", 20))
	var wood_avg := float(average_prices.get("wood", 1.0))
	var stone_avg := float(average_prices.get("stone", 1.0))
	var grain_avg := float(average_prices.get("grain", 1.0))

	player_state_title.text = "Stare jucător / piață"

	player_state_label.text = (
		"Resurse:\n" +
		"Lemn: %d\n" +
		"Piatră: %d\n" +
		"Grâne: %d\n" +
		"Galbeni: %d\n\n" +
		"Indicatori piață:\n" +
		"Inflație: %d\n" +
		"Preț mediu lemn: %.2f\n" +
		"Preț mediu piatră: %.2f\n" +
		"Preț mediu grâne: %.2f"
	) % [
		wood,
		stone,
		grain,
		galbeni,
		inflation,
		wood_avg,
		stone_avg,
		grain_avg
	]
