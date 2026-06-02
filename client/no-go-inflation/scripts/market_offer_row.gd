class_name MarketOfferRow
extends VBoxContainer

signal accept_requested(offer_id: String, quantity: int)
signal cancel_requested(offer_id: String)

var _offer_id := ""
var _offer: Dictionary = {}
var _quantity_spin: SpinBox
var _accept_button: Button
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
		row.add_child(_create_cancel_button(offer))
	else:
		_accept_button = _create_accept_button(offer)
		row.add_child(_accept_button)
	
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
	quantity_spin.value_changed.connect(_on_quantity_changed)
	
	return quantity_spin


func _create_accept_button(offer: Dictionary) -> Button:
	var remaining := int(offer.get("remainingQuantity", 0))
	var min_quantity := int(offer.get("minQuantity", 1))
	
	var accept_button := Button.new()
	accept_button.text = "Acceptă"
	accept_button.disabled = (
		_offer_id.is_empty()
		or remaining <= 0
		or remaining < min_quantity
	)
	
	accept_button.pressed.connect(_on_accept_pressed)
	
	return accept_button


func _create_cancel_button(_offer: Dictionary) -> Button:
	var cancel_button := Button.new()
	cancel_button.text = "Retrage"
	cancel_button.disabled = _offer_id.is_empty()
	cancel_button.pressed.connect(_on_cancel_pressed)
	return cancel_button


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
	var min_quantity := int(_offer.get("minQuantity", 1))
	
	if quantity < min_quantity:
		return "Cantitatea minimă acceptată este %d." % min_quantity
	
	if quantity > remaining:
		return "Cantitatea cerută depășește cantitatea disponibilă."
	
	if offer_type == GameDomain.OFFER_SELL:
		var total_price := quantity * price
		var galbeni := GameState.get_resource_amount(GameDomain.RESOURCE_GALBENI)
		
		if galbeni < total_price:
			return "Nu ai suficienți galbeni. Cost: %d, disponibil: %d." % [
				total_price,
				galbeni
			]
	
	if offer_type == GameDomain.OFFER_BUY:
		var owned := GameState.get_resource_amount(resource)
		
		if owned < quantity:
			return "Nu ai suficiente resurse. Necesar: %d, disponibil: %d." % [
				quantity,
				owned
			]
	
	return ""


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
