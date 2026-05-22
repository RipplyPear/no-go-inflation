extends Node2D

@onready var map_root: MapRoot = $MapRoot
@onready var building_popup: BuildingPopup = $BuildingPopup

@onready var time_label: Label = $HUD/TopPanel/MarginContainer/VBoxContainer/TimeLabel
@onready var resource_label: Label = $HUD/TopPanel/MarginContainer/VBoxContainer/ResourceLabel


func _ready() -> void:
	map_root.tile_clicked.connect(_on_tile_clicked)

	building_popup.build_requested.connect(_on_build_requested)
	building_popup.upgrade_requested.connect(_on_upgrade_requested)
	building_popup.collect_requested.connect(_on_collect_requested)

	_update_hud_from_game_state()


func _update_hud_from_game_state() -> void:
	time_label.text = _format_time_label(
		GameState.current_day,
		GameState.current_minute
	)

	var resources := GameState.resources
	var economy := GameState.economy

	var wood := int(resources.get("wood", 0))
	var stone := int(resources.get("stone", 0))
	var grain := int(resources.get("grain", 0))
	var galbeni := int(resources.get("galbeni", 0))
	var inflation := int(economy.get("inflation", 20))

	resource_label.text = "Lemn: %d | Piatră: %d | Grâne: %d | Galbeni: %d | Inflație: %d" % [
		wood,
		stone,
		grain,
		galbeni,
		inflation
	]


func _format_time_label(day: int, minute: int) -> String:
	var day_names := {
		1: "Luni",
		2: "Marți",
		3: "Miercuri",
		4: "Joi",
		5: "Vineri",
	}

	var hour := int(minute / 60)
	var min_part := minute % 60
	var day_label := str(day_names.get(day, "Ziua %d" % day))

	return "%s - %02d:%02d" % [day_label, hour, min_part]


func _on_tile_clicked(x: int, y: int, tile_type: String) -> void:
	var building: Dictionary = map_root.get_building_at(x, y)
	building_popup.show_for_selection(x, y, tile_type, building)


func _on_build_requested(x: int, y: int, tile_type: String) -> void:
	var success: bool = map_root.build_at(x, y, tile_type)

	if success:
		print("Build confirmed locally at (%d, %d) on %s" % [x, y, tile_type])
	else:
		print("Build failed locally at (%d, %d) on %s" % [x, y, tile_type])

	_update_hud_from_game_state()


func _on_upgrade_requested(x: int, y: int) -> void:
	var success: bool = map_root.upgrade_at(x, y)

	if success:
		print("Upgrade confirmed locally at (%d, %d)" % [x, y])
	else:
		print("Upgrade failed locally at (%d, %d)" % [x, y])

	_update_hud_from_game_state()


func _on_collect_requested(x: int, y: int) -> void:
	var collected: int = map_root.collect_at(x, y)

	print("Collected %d resources from building at (%d, %d)" % [collected, x, y])

	_update_hud_from_game_state()
