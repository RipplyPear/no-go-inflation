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
	"farm": {"wood": 10, "stone": 20},
	"mine": {"wood": 20, "grain": 10},
	"lumberyard": {"stone": 10, "grain": 20},
}

var selected_x: int = -1
var selected_y: int = -1
var selected_tile_type := ""

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


func show_for_selection(x: int, y: int, tile_type: String, building: Dictionary, map_screen_offset: Vector2 = Vector2.ZERO) -> void:
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
	var building_type := str(GameDomain.BUILDING_BY_TILE.get(tile_type, ""))
	var cost: Dictionary = BUILD_COSTS.get(building_type, {})
	title_label.text = tr("BUILDING_LOT_TITLE").format({"x": selected_x, "y": selected_y})
	info_label.text = tr("BUILDING_EMPTY_INFO").format({
		"tile": GameDomain.get_tile_label(tile_type),
		"building": GameDomain.get_building_label(building_type),
		"cost": _format_cost(cost),
		"capacity": STORAGE_PER_LEVEL,
	})
	build_button.visible = true
	build_button.disabled = false
	upgrade_button.visible = false
	collect_button.visible = false


func _show_existing_building(building: Dictionary) -> void:
	var building_type := str(building.get("type", "unknown"))
	var level := int(building.get("level", 1))
	var stored := int(building.get("stored", 0))
	var capacity := level * STORAGE_PER_LEVEL
	title_label.text = tr("BUILDING_TITLE").format({
		"building": GameDomain.get_building_label(building_type),
		"level": level,
	})
	var lines: Array[String] = [
		tr("BUILDING_LEVEL").format({"level": level}),
		tr("BUILDING_PRODUCTION").format({"amount": level}),
		tr("BUILDING_STORAGE").format({"stored": stored, "capacity": capacity}),
	]
	if level < 3:
		var upgrade_cost := _get_upgrade_cost(building_type, level)
		lines.append(tr("BUILDING_UPGRADE_COST").format({"cost": _format_cost(upgrade_cost)}))
		lines.append(tr("BUILDING_AFTER_UPGRADE").format({
			"production": level + 1,
			"capacity": (level + 1) * STORAGE_PER_LEVEL,
		}))
	else:
		lines.append(tr("BUILDING_MAX_LEVEL"))
	info_label.text = "\n".join(lines)
	build_button.visible = false
	upgrade_button.visible = true
	upgrade_button.disabled = level >= 3
	collect_button.visible = true
	collect_button.disabled = stored <= 0


func _format_cost(cost: Dictionary) -> String:
	var parts: Array[String] = []
	for resource in cost.keys():
		parts.append(tr("BUILDING_COST_ITEM").format({
			"amount": int(cost[resource]),
			"resource": GameDomain.get_resource_label(str(resource)),
		}))
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
	var next_position := tile_top_left + Vector2(0, TILE_SIZE.y)
	var panel_size := panel.size
	if panel_size.x <= 1 or panel_size.y <= 1:
		panel_size = panel.get_combined_minimum_size()
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
