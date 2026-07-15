class_name MarketPopup
extends CanvasLayer

signal create_offer_requested(offer_type: String, resource: String, amount: int, price: int)
signal accept_offer_requested(offer_id: String, quantity: int)
signal cancel_offer_requested(offer_id: String)
signal recycle_requested(resource: String, quantity: int)

@onready var panel: PanelContainer = $PanelContainer
@onready var type_option: OptionButton = $PanelContainer/MarginContainer/VBoxContainer/HBoxContainer/CreatePanel/TypeOption
@onready var resource_option: OptionButton = $PanelContainer/MarginContainer/VBoxContainer/HBoxContainer/CreatePanel/ResourceOption
@onready var amount_spin: SpinBox = $PanelContainer/MarginContainer/VBoxContainer/HBoxContainer/CreatePanel/AmountSpin
@onready var price_spin: SpinBox = $PanelContainer/MarginContainer/VBoxContainer/HBoxContainer/CreatePanel/PriceSpin
@onready var create_button: Button = $PanelContainer/MarginContainer/VBoxContainer/HBoxContainer/CreatePanel/CreateButton
@onready var recycle_resource_option: OptionButton = $PanelContainer/MarginContainer/VBoxContainer/HBoxContainer/PlayerStatePanel/RecycleResourceOption
@onready var recycle_amount_spin: SpinBox = $PanelContainer/MarginContainer/VBoxContainer/HBoxContainer/PlayerStatePanel/RecycleAmountSpin
@onready var recycle_button: Button = $PanelContainer/MarginContainer/VBoxContainer/HBoxContainer/PlayerStatePanel/RecycleButton
@onready var offer_list: VBoxContainer = $PanelContainer/MarginContainer/VBoxContainer/HBoxContainer/OffersPanel/OfferScroll/OfferList
@onready var player_state_title: Label = $PanelContainer/MarginContainer/VBoxContainer/HBoxContainer/PlayerStatePanel/PlayerStateTitle
@onready var player_state_label: Label = $PanelContainer/MarginContainer/VBoxContainer/HBoxContainer/PlayerStatePanel/PlayerStateLabel
@onready var x_button: Button = $PanelContainer/MarginContainer/VBoxContainer/HeaderHBox/XButton
@onready var close_button: Button = $PanelContainer/MarginContainer/VBoxContainer/CloseButton


func _ready() -> void:
	panel.visible = false
	_setup_offer_options()
	_setup_spin_boxes()
	_connect_signals()
	panel.position = Vector2(90, 120)
	panel.custom_minimum_size = Vector2(1100, 500)
	refresh_player_state()


func show_popup() -> void:
	refresh_player_state()
	_update_offer_amount_limit()
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
	type_option.add_item(tr("MARKET_BUY"))
	type_option.add_item(tr("MARKET_SELL"))
	resource_option.clear()
	recycle_resource_option.clear()
	for resource in GameDomain.BASIC_RESOURCES:
		var label := GameDomain.get_resource_label(resource)
		resource_option.add_item(label)
		recycle_resource_option.add_item(label)


func _setup_spin_boxes() -> void:
	_configure_spin_box(amount_spin, 1, 999, 10)
	_configure_spin_box(price_spin, 1, 999, 1)
	_configure_spin_box(recycle_amount_spin, 1, 999, 1)


func _configure_spin_box(spin_box: SpinBox, min_value: int, max_value: int, default_value: int) -> void:
	spin_box.min_value = min_value
	spin_box.max_value = max_value
	spin_box.value = default_value
	spin_box.step = 1


func _connect_signals() -> void:
	create_button.pressed.connect(_on_create_pressed)
	recycle_button.pressed.connect(_on_recycle_pressed)
	x_button.pressed.connect(hide_popup)
	close_button.pressed.connect(hide_popup)
	resource_option.item_selected.connect(_on_offer_inputs_changed)
	type_option.item_selected.connect(_on_offer_inputs_changed)


func _on_recycle_pressed() -> void:
	var index := clampi(recycle_resource_option.selected, 0, GameDomain.BASIC_RESOURCES.size() - 1)
	recycle_requested.emit(GameDomain.BASIC_RESOURCES[index], int(recycle_amount_spin.value))


func _on_create_pressed() -> void:
	var offer_type := _get_selected_offer_type()
	var resource := _get_selected_resource()
	_update_offer_amount_limit()
	var amount := int(amount_spin.value)
	if offer_type == GameDomain.OFFER_SELL:
		var owned := GameState.get_resource_amount(resource)
		if owned <= 0:
			push_warning(tr("MARKET_NO_RESOURCE_TO_SELL"))
			return
		if amount > owned:
			amount = owned
			amount_spin.value = owned
	create_offer_requested.emit(offer_type, resource, amount, int(price_spin.value))


func _on_offer_inputs_changed(_index: int) -> void:
	_update_offer_amount_limit()


func _update_offer_amount_limit() -> void:
	if _get_selected_offer_type() == GameDomain.OFFER_SELL:
		var owned := GameState.get_resource_amount(_get_selected_resource())
		amount_spin.max_value = max(1, owned)
		amount_spin.value = min(amount_spin.value, amount_spin.max_value)
	else:
		amount_spin.max_value = 999


func _get_selected_offer_type() -> String:
	return GameDomain.OFFER_TYPES[clampi(type_option.selected, 0, GameDomain.OFFER_TYPES.size() - 1)]


func _get_selected_resource() -> String:
	return GameDomain.BASIC_RESOURCES[clampi(resource_option.selected, 0, GameDomain.BASIC_RESOURCES.size() - 1)]


func _render_offer_list(market_state: Dictionary) -> void:
	_clear_offer_list()
	var offers = market_state.get("offers", [])
	if typeof(offers) != TYPE_ARRAY or offers.is_empty():
		var label := Label.new()
		label.text = tr("MARKET_NO_ACTIVE_OFFERS")
		offer_list.add_child(label)
		return
	for offer in offers:
		if typeof(offer) == TYPE_DICTIONARY:
			_add_offer_row(offer)


func _clear_offer_list() -> void:
	for child in offer_list.get_children():
		child.queue_free()


func _add_offer_row(offer: Dictionary) -> void:
	var row := MarketOfferRow.new()
	row.setup(offer)
	row.accept_requested.connect(_on_offer_row_accept_requested)
	row.cancel_requested.connect(_on_offer_row_cancel_requested)
	offer_list.add_child(row)


func show_offer_error(offer_id: String, message: String) -> void:
	if offer_id.is_empty():
		return
	for child in offer_list.get_children():
		if child is MarketOfferRow and child.matches_offer(offer_id):
			child.show_error(message)
			return
	push_warning(message)


func _on_offer_row_accept_requested(offer_id: String, quantity: int) -> void:
	accept_offer_requested.emit(offer_id, quantity)


func _on_offer_row_cancel_requested(offer_id: String) -> void:
	cancel_offer_requested.emit(offer_id)


func _update_side_panel(market_state: Dictionary) -> void:
	var economy := _get_economy_for_display(market_state)
	var prices: Dictionary = economy.get("averagePrices", {})
	player_state_title.text = tr("MARKET_PLAYER_STATE_OVERVIEW")
	player_state_label.text = tr("MARKET_PLAYER_STATE_BODY").format({
		"wood": GameState.get_resource_amount(GameDomain.RESOURCE_WOOD),
		"stone": GameState.get_resource_amount(GameDomain.RESOURCE_STONE),
		"grain": GameState.get_resource_amount(GameDomain.RESOURCE_GRAIN),
		"gold": GameState.get_resource_amount(GameDomain.RESOURCE_GALBENI),
		"inflation": int(economy.get("inflation", 20)),
		"wood_price": _get_average_price(prices, GameDomain.RESOURCE_WOOD),
		"stone_price": _get_average_price(prices, GameDomain.RESOURCE_STONE),
		"grain_price": _get_average_price(prices, GameDomain.RESOURCE_GRAIN),
	})


func _get_economy_for_display(market_state: Dictionary) -> Dictionary:
	var economy = market_state.get("economy", GameState.economy)
	return economy if typeof(economy) == TYPE_DICTIONARY else GameState.economy


func _get_average_price(prices: Dictionary, resource: String) -> float:
	return float(prices.get(resource, GameState.get_average_price(resource)))
