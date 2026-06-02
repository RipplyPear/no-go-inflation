class_name BuildingPopup
extends CanvasLayer

signal build_requested(x: int, y: int, tile_type: String)
signal upgrade_requested(x: int, y: int)
signal collect_requested(x: int, y: int)

const TILE_SIZE := Vector2(64, 64)

const STORAGE_PER_LEVEL := 60

const SCREEN_SIZE := Vector2(1280, 720)
const PANEL_MARGIN := 8

const BUILD_COSTS := {
	"farm": {
		"wood": 10,
		"stone": 20,
	},
	"mine": {
		"wood": 20,
		"grain": 10,
	},
	"lumberyard": {
		"stone": 10,
		"grain": 20,
	},
}

const BUILDING_LABELS := {
	"farm": "Fermă",
	"mine": "Mină",
	"lumberyard": "Lemnărie",
}

const RESOURCE_LABELS := {
	"wood": "lemn",
	"stone": "piatră",
	"grain": "grâne",
}

const BUILDING_BY_TILE := {
	"field": "farm",
	"quarry": "mine",
	"forest": "lumberyard",
}

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

func show_for_selection(
	x: int,
	y: int,
	tile_type: String,
	building: Dictionary,
	map_screen_offset: Vector2 = Vector2.ZERO
) -> void:
	panel.position = map_screen_offset + Vector2(
		x * TILE_SIZE.x,
		(y + 1) * TILE_SIZE.y
	)
	
	selected_x = x
	selected_y = y
	selected_tile_type = tile_type
	
	if building.is_empty():
		_show_empty_lot(tile_type)
	else:
		_show_existing_building(building)
	
	panel.visible = true
	await get_tree().process_frame
	_place_panel_near_tile(x, y, map_screen_offset)

func hide_popup() -> void:
	panel.visible = false

func _show_empty_lot(tile_type: String) -> void:
	var tile_label: String = str(GameDomain.TILE_LABELS.get(tile_type, tile_type))
	var building_type: String = str(GameDomain.BUILDING_BY_TILE.get(tile_type, ""))
	var cost: Dictionary = BUILD_COSTS.get(building_type, {})
	
	title_label.text = "Lot (%d, %d)" % [selected_x, selected_y]
	info_label.text = "Tip lot: %s\nSe poate construi: %s\nCost construire: %s\nProducție nivel 1: 1 unitate/minut\nCapacitate nivel 1: 60 unități" % [
		tile_label,
		str(BUILDING_LABELS.get(building_type, building_type)),
		_format_cost(cost),
	]
	
	build_button.visible = true
	build_button.disabled = false
	
	upgrade_button.visible = false
	collect_button.visible = false

func _show_existing_building(building: Dictionary) -> void:
	var building_type := str(building.get("type", "unknown"))
	var level := int(building.get("level", 1))
	var stored := int(building.get("stored", 0))
	var capacity := level * STORAGE_PER_LEVEL
	
	var building_label: String = str(GameDomain.BUILDING_LABELS.get(building_type, building_type))
	var produced_resource_key: String = str(GameDomain.RESOURCE_BY_BUILDING.get(building_type, ""))
	var produced_resource: String = str(GameDomain.RESOURCE_LABELS.get(produced_resource_key, "resursă"))
	
	title_label.text = "%s - Nivel %d" % [building_label, level]
	
	var lines: Array[String] = [
		"Nivel: %d" % level,
		"Producție: %d unități/minut" % level,
		"Stocare: %d / %d" % [stored, capacity],
	]
	
	if level < 3:
		var upgrade_cost := _get_upgrade_cost(building_type, level)
		lines.append("Cost upgrade: %s" % _format_cost(upgrade_cost))
		lines.append("După upgrade: %d unități/minut, capacitate %d" % [
			level + 1,
			(level + 1) * STORAGE_PER_LEVEL,
		])
	else:
		lines.append("Clădire la nivel maxim.")
	
	info_label.text = "\n".join(lines)
	
	
	build_button.visible = false
	
	upgrade_button.visible = true
	upgrade_button.disabled = level >= 3
	
	collect_button.visible = true
	collect_button.disabled = stored <= 0

func _format_cost(cost: Dictionary) -> String:
	var parts: Array[String] = []
	
	for resource in cost.keys():
		parts.append("%d %s" % [
			int(cost[resource]),
			str(RESOURCE_LABELS.get(resource, resource)),
		])
	
	return ", ".join(parts)


func _get_upgrade_cost(building: String, current_level: int) -> Dictionary:
	var base_cost: Dictionary = BUILD_COSTS.get(building, {})
	var multiplier := 1
	
	if current_level == 1:
		multiplier = 2
	elif current_level == 2:
		multiplier = 4
	else:
		return {}
	
	var result := {}
	
	for resource in base_cost.keys():
		result[resource] = int(base_cost[resource]) * multiplier
	
	return result


func _place_panel_near_tile(x: int, y: int, map_screen_offset: Vector2) -> void:
	var tile_top_left := map_screen_offset + Vector2(x * TILE_SIZE.x, y * TILE_SIZE.y)
	var below_tile := tile_top_left + Vector2(0, TILE_SIZE.y)
	
	var panel_size := panel.size
	
	if panel_size.x <= 1 or panel_size.y <= 1:
		panel_size = panel.get_combined_minimum_size()
	
	var next_position := below_tile
	
	if next_position.y + panel_size.y > SCREEN_SIZE.y:
		next_position.y = tile_top_left.y - panel_size.y
	
	if next_position.x + panel_size.x > SCREEN_SIZE.x:
		next_position.x = SCREEN_SIZE.x - panel_size.x - PANEL_MARGIN
	
	next_position.x = max(PANEL_MARGIN, next_position.x)
	next_position.y = max(PANEL_MARGIN, next_position.y)
	
	panel.position = next_position


func _on_build_pressed() -> void:
	build_requested.emit(selected_x, selected_y, selected_tile_type)
	hide_popup()

func _on_upgrade_pressed() -> void:
	upgrade_requested.emit(selected_x, selected_y)
	hide_popup()

func _on_collect_pressed() -> void:
	collect_requested.emit(selected_x, selected_y)
	hide_popup()
