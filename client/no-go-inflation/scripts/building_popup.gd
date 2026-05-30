class_name BuildingPopup
extends CanvasLayer

signal build_requested(x: int, y: int, tile_type: String)
signal upgrade_requested(x: int, y: int)
signal collect_requested(x: int, y: int)

const TILE_SIZE := Vector2(64, 64)

var selected_x: int = -1
var selected_y: int = -1
var selected_tile_type: String = ""

@onready var panel: PanelContainer = $PanelContainer
@onready var title_label: Label = $PanelContainer/MarginContainer/VBoxContainer/TitleLabel
@onready var info_label: Label = $PanelContainer/MarginContainer/VBoxContainer/InfoLabel
@onready var build_button: Button = $PanelContainer/MarginContainer/VBoxContainer/BuildButton
@onready var upgrade_button: Button = $PanelContainer/MarginContainer/VBoxContainer/UpgradeButton
@onready var collect_button: Button = $PanelContainer/MarginContainer/VBoxContainer/CollectButton
@onready var close_button: Button = $PanelContainer/MarginContainer/VBoxContainer/CloseButton

func _ready() -> void:
	panel.visible = false

	build_button.pressed.connect(_on_build_pressed)
	upgrade_button.pressed.connect(_on_upgrade_pressed)
	collect_button.pressed.connect(_on_collect_pressed)
	close_button.pressed.connect(hide_popup)

func show_for_selection(x: int, y: int, tile_type: String, building: Dictionary) -> void:
	set_offset(Vector2(x * TILE_SIZE.x, (y + 1) * TILE_SIZE.y))

	selected_x = x
	selected_y = y
	selected_tile_type = tile_type

	if building.is_empty():
		_show_empty_lot(tile_type)
	else:
		_show_existing_building(building)

	panel.visible = true

func hide_popup() -> void:
	panel.visible = false

func _show_empty_lot(tile_type: String) -> void:
	var tile_label: String = str(GameDomain.TILE_LABELS.get(tile_type, tile_type))
	var building_type: String = str(GameDomain.BUILDING_BY_TILE.get(tile_type, ""))
	var building_label: String = str(GameDomain.BUILDING_LABELS.get(building_type, "clădire"))

	title_label.text = "Lot (%d, %d)" % [selected_x, selected_y]
	info_label.text = "Tip lot: %s\nSe poate construi: %s" % [tile_label, building_label]

	build_button.visible = true
	build_button.disabled = false

	upgrade_button.visible = false
	collect_button.visible = false

func _show_existing_building(building: Dictionary) -> void:
	var building_type := str(building.get("type", "unknown"))
	var level := int(building.get("level", 1))
	var stored := int(building.get("stored", 0))

	var building_label: String = str(GameDomain.BUILDING_LABELS.get(building_type, building_type))
	var produced_resource_key: String = str(GameDomain.RESOURCE_BY_BUILDING.get(building_type, ""))
	var produced_resource: String = str(GameDomain.RESOURCE_LABELS.get(produced_resource_key, "resursă"))

	title_label.text = "%s - Nivel %d" % [building_label, level]
	info_label.text = "Produce: %s\nStocare internă: %d" % [produced_resource, stored]

	build_button.visible = false

	upgrade_button.visible = true
	upgrade_button.disabled = level >= 3

	collect_button.visible = true
	collect_button.disabled = stored <= 0

func _on_build_pressed() -> void:
	build_requested.emit(selected_x, selected_y, selected_tile_type)
	hide_popup()

func _on_upgrade_pressed() -> void:
	upgrade_requested.emit(selected_x, selected_y)
	hide_popup()

func _on_collect_pressed() -> void:
	collect_requested.emit(selected_x, selected_y)
	hide_popup()
