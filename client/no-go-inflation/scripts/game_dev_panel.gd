class_name GameDevPanel
extends VBoxContainer

signal seed_bot_offer_requested(price_per_unit: int)
signal force_finish_requested

const SEED_PRICES := [5, 7, 9, 12]
var _seed_price_index := 0
var _seed_button: Button


func _ready() -> void:
	_seed_button = Button.new()
	_update_seed_button_text()
	_seed_button.pressed.connect(_on_seed_bot_offer_pressed)
	add_child(_seed_button)
	var force_finish_button := Button.new()
	force_finish_button.text = tr("DEV_FINISH_SESSION")
	force_finish_button.pressed.connect(_on_force_finish_pressed)
	add_child(force_finish_button)


func advance_seed_price() -> void:
	_seed_price_index = (_seed_price_index + 1) % SEED_PRICES.size()
	_update_seed_button_text()


func _get_current_seed_price() -> int:
	return SEED_PRICES[_seed_price_index]


func _update_seed_button_text() -> void:
	if _seed_button != null:
		_seed_button.text = tr("DEV_BOT_OFFER").format({"price": _get_current_seed_price()})


func _on_seed_bot_offer_pressed() -> void:
	seed_bot_offer_requested.emit(_get_current_seed_price())


func _on_force_finish_pressed() -> void:
	force_finish_requested.emit()
