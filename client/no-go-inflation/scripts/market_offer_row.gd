class_name MarketOfferRow
extends VBoxContainer

signal accept_requested(offer_id: String, quantity: int)
signal cancel_requested(offer_id: String)

var _offer_id := ""
var _offer: Dictionary = {}
var _quantity_spin: SpinBox
var _error_label: Label


func setup(offer: Dictionary) -> void:
	_offer = offer.duplicate(true)
	_offer_id = str(offer.get("id", ""))
	var row := HBoxContainer.new()
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	add_child(row)
	var offer_label := _create_offer_label(offer)
	offer_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(offer_label)
	_quantity_spin = _create_quantity_spin(offer)
	row.add_child(_quantity_spin)
	if bool(offer.get("isOwnOffer", false)):
		row.add_child(_create_cancel_button())
	else:
		row.add_child(_create_accept_button(offer))
	_error_label = Label.new()
	_error_label.visible = false
	_error_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_error_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_error_label.add_theme_color_override("font_color", Color(1.0, 0.35, 0.35))
	add_child(_error_label)


func matches_offer(offer_id: String) -> bool:
	return _offer_id == offer_id


func show_error(message: String) -> void:
	if _error_label == null:
		return
	_error_label.text = message
	_error_label.visible = not message.is_empty()


func clear_error() -> void:
	show_error("")


func _create_offer_label(offer: Dictionary) -> Label:
	var label := Label.new()
	label.text = tr("MARKET_OFFER_ROW").format({
		"type": _get_offer_type_label(str(offer.get("offerType", ""))),
		"resource": GameDomain.get_resource_label(str(offer.get("resource", ""))),
		"remaining": int(offer.get("remainingQuantity", 0)),
		"price": int(offer.get("pricePerUnit", 0)),
		"creator": str(offer.get("creatorName", tr("MARKET_UNKNOWN_CREATOR"))),
	})
	return label


func _create_quantity_spin(offer: Dictionary) -> SpinBox:
	var remaining := int(offer.get("remainingQuantity", 0))
	var minimum := int(offer.get("minQuantity", 1))
	var quantity_spin := SpinBox.new()
	quantity_spin.min_value = max(1, minimum)
	quantity_spin.max_value = max(quantity_spin.min_value, remaining)
	quantity_spin.value = quantity_spin.min_value
	quantity_spin.step = 1
	quantity_spin.value_changed.connect(_on_quantity_changed)
	return quantity_spin


func _create_accept_button(offer: Dictionary) -> Button:
	var button := Button.new()
	var remaining := int(offer.get("remainingQuantity", 0))
	var minimum := int(offer.get("minQuantity", 1))
	button.text = tr("MARKET_ACCEPT")
	button.disabled = _offer_id.is_empty() or remaining <= 0 or remaining < minimum
	button.pressed.connect(_on_accept_pressed)
	return button


func _create_cancel_button() -> Button:
	var button := Button.new()
	button.text = tr("MARKET_WITHDRAW")
	button.disabled = _offer_id.is_empty()
	button.pressed.connect(_on_cancel_pressed)
	return button


func _on_accept_pressed() -> void:
	if _quantity_spin == null:
		return
	var quantity := int(_quantity_spin.value)
	var local_error := _get_local_accept_error(quantity)
	if not local_error.is_empty():
		show_error(local_error)
		return
	clear_error()
	accept_requested.emit(_offer_id, quantity)


func _on_cancel_pressed() -> void:
	cancel_requested.emit(_offer_id)


func _on_quantity_changed(_value: float) -> void:
	clear_error()


func _get_local_accept_error(quantity: int) -> String:
	var offer_type := str(_offer.get("offerType", ""))
	var resource := str(_offer.get("resource", ""))
	var price := int(_offer.get("pricePerUnit", 0))
	var remaining := int(_offer.get("remainingQuantity", 0))
	var minimum := int(_offer.get("minQuantity", 1))
	if quantity < minimum:
		return tr("MARKET_MINIMUM_QUANTITY").format({"quantity": minimum})
	if quantity > remaining:
		return tr("MARKET_QUANTITY_EXCEEDS_AVAILABLE")
	if offer_type == GameDomain.OFFER_SELL:
		var total_price := quantity * price
		var gold := GameState.get_resource_amount(GameDomain.RESOURCE_GALBENI)
		if gold < total_price:
			return tr("MARKET_INSUFFICIENT_GOLD").format({"cost": total_price, "available": gold})
	if offer_type == GameDomain.OFFER_BUY:
		var owned := GameState.get_resource_amount(resource)
		if owned < quantity:
			return tr("MARKET_INSUFFICIENT_RESOURCE").format({"required": quantity, "available": owned})
	return ""


func _get_offer_type_label(offer_type: String) -> String:
	match offer_type:
		GameDomain.OFFER_BUY:
			return tr("MARKET_BUY_ACTION")
		GameDomain.OFFER_SELL:
			return tr("MARKET_SELL_ACTION")
		_:
			return offer_type
