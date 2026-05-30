class_name MarketOfferRow
extends HBoxContainer

signal accept_requested(offer_id: String, quantity: int)

var _offer_id := ""
var _quantity_spin: SpinBox


func setup(offer: Dictionary) -> void:
	_offer_id = str(offer.get("id", ""))

	add_child(_create_offer_label(offer))

	_quantity_spin = _create_quantity_spin(offer)
	add_child(_quantity_spin)

	add_child(_create_accept_button(offer))


func _create_offer_label(offer: Dictionary) -> Label:
	var offer_type := str(offer.get("offerType", ""))
	var resource := str(offer.get("resource", ""))
	var remaining := int(offer.get("remainingQuantity", 0))
	var price := int(offer.get("pricePerUnit", 0))
	var creator := str(offer.get("creatorName", "unknown"))

	var label := Label.new()
	label.text = "%s %s | rămas: %d | preț: %d | de la: %s" % [
		_get_offer_type_label(offer_type),
		_get_resource_label(resource),
		remaining,
		price,
		creator
	]

	return label


func _create_quantity_spin(offer: Dictionary) -> SpinBox:
	var remaining := int(offer.get("remainingQuantity", 0))
	var min_quantity := int(offer.get("minQuantity", 1))

	var quantity_spin := SpinBox.new()
	quantity_spin.min_value = max(1, min_quantity)
	quantity_spin.max_value = max(quantity_spin.min_value, remaining)
	quantity_spin.value = quantity_spin.min_value
	quantity_spin.step = 1

	return quantity_spin


func _create_accept_button(offer: Dictionary) -> Button:
	var remaining := int(offer.get("remainingQuantity", 0))
	var min_quantity := int(offer.get("minQuantity", 1))
	var is_own_offer := bool(offer.get("isOwnOffer", false))

	var accept_button := Button.new()
	accept_button.text = "Acceptă"
	accept_button.disabled = (
		is_own_offer
		or _offer_id.is_empty()
		or remaining <= 0
		or remaining < min_quantity
	)

	accept_button.pressed.connect(_on_accept_pressed)

	return accept_button


func _on_accept_pressed() -> void:
	if _quantity_spin == null:
		return

	accept_requested.emit(_offer_id, int(_quantity_spin.value))


func _get_offer_type_label(offer_type: String) -> String:
	match offer_type:
		GameDomain.OFFER_BUY:
			return "Cumpără"
		GameDomain.OFFER_SELL:
			return "Vinde"
		_:
			return offer_type


func _get_resource_label(resource: String) -> String:
	return str(GameDomain.RESOURCE_LABELS.get(resource, resource))
