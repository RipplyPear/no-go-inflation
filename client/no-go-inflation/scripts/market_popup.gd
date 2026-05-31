class_name MarketPopup
extends CanvasLayer

signal create_offer_requested(offer_type: String, resource: String, amount: int, price: int)
signal accept_offer_requested(offer_id: String, quantity: int)

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
	
	_setup_offer_options()
	_setup_spin_boxes()
	_connect_signals()
	
	player_state_title.text = "Starea jucătorului"
	refresh_player_state()


func show_popup() -> void:
	refresh_player_state()
	panel.visible = true


func hide_popup() -> void:
	panel.visible = false


func refresh_player_state() -> void:
	_update_side_panel({})


func set_market_state(market_state: Dictionary) -> void:
	_update_side_panel(market_state)
	_render_offer_list(market_state)


func _setup_offer_options() -> void:
	type_option.clear()
	type_option.add_item("Cumpărare")
	type_option.add_item("Vânzare")
	
	resource_option.clear()
	resource_option.add_item(GameDomain.RESOURCE_LABELS.get(GameDomain.RESOURCE_WOOD, "Lemn"))
	resource_option.add_item(GameDomain.RESOURCE_LABELS.get(GameDomain.RESOURCE_STONE, "Piatră"))
	resource_option.add_item(GameDomain.RESOURCE_LABELS.get(GameDomain.RESOURCE_GRAIN, "Grâne"))


func _setup_spin_boxes() -> void:
	_configure_spin_box(amount_spin, 1, 999, 10)
	_configure_spin_box(price_spin, 1, 999, 1)


func _configure_spin_box(spin_box: SpinBox, min_value: int, max_value: int, default_value: int) -> void:
	spin_box.min_value = min_value
	spin_box.max_value = max_value
	spin_box.value = default_value
	spin_box.step = 1


func _connect_signals() -> void:
	create_button.pressed.connect(_on_create_pressed)
	close_button.pressed.connect(hide_popup)


func _on_create_pressed() -> void:
	var offer_type := _get_selected_offer_type()
	var resource := _get_selected_resource()
	var amount := int(amount_spin.value)
	var price := int(price_spin.value)
	
	create_offer_requested.emit(offer_type, resource, amount, price)


func _get_selected_offer_type() -> String:
	var selected_index := clampi(type_option.selected, 0, GameDomain.OFFER_TYPES.size() - 1)
	return GameDomain.OFFER_TYPES[selected_index]


func _get_selected_resource() -> String:
	var selected_index := clampi(resource_option.selected, 0, GameDomain.BASIC_RESOURCES.size() - 1)
	return GameDomain.BASIC_RESOURCES[selected_index]


func _render_offer_list(market_state: Dictionary) -> void:
	_clear_offer_list()
	
	var offers = market_state.get("offers", [])
	
	if typeof(offers) != TYPE_ARRAY or offers.is_empty():
		_add_empty_offer_label()
		return
	
	for offer in offers:
		if typeof(offer) != TYPE_DICTIONARY:
			continue
	
		_add_offer_row(offer)


func _clear_offer_list() -> void:
	for child in offer_list.get_children():
		child.queue_free()


func _add_empty_offer_label() -> void:
	var empty_label := Label.new()
	empty_label.text = "Nu există oferte active."
	offer_list.add_child(empty_label)


func _add_offer_row(offer: Dictionary) -> void:
	var row := MarketOfferRow.new()
	row.setup(offer)
	row.accept_requested.connect(_on_offer_row_accept_requested)
	offer_list.add_child(row)


func _on_offer_row_accept_requested(offer_id: String, quantity: int) -> void:
	accept_offer_requested.emit(offer_id, quantity)


func _update_side_panel(market_state: Dictionary) -> void:
	var economy := _get_economy_for_display(market_state)
	var average_prices: Dictionary = economy.get("averagePrices", {})
	
	var inflation := int(economy.get("inflation", 20))
	
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
		_get_resource_amount(GameDomain.RESOURCE_WOOD),
		_get_resource_amount(GameDomain.RESOURCE_STONE),
		_get_resource_amount(GameDomain.RESOURCE_GRAIN),
		_get_resource_amount(GameDomain.RESOURCE_GALBENI),
		inflation,
		_get_average_price(average_prices, GameDomain.RESOURCE_WOOD),
		_get_average_price(average_prices, GameDomain.RESOURCE_STONE),
		_get_average_price(average_prices, GameDomain.RESOURCE_GRAIN)
	]


func _get_economy_for_display(market_state: Dictionary) -> Dictionary:
	var economy = market_state.get("economy", GameState.economy)
	
	if typeof(economy) != TYPE_DICTIONARY:
		return GameState.economy
	
	return economy


func _get_resource_amount(resource: String) -> int:
	return GameState.get_resource_amount(resource)


func _get_average_price(average_prices: Dictionary, resource: String) -> float:
	return float(average_prices.get(resource, GameState.get_average_price(resource)))
