extends Node2D

@onready var map_root: MapRoot = $MapRoot
@onready var building_popup: BuildingPopup = $BuildingPopup

func _ready() -> void:
	map_root.tile_clicked.connect(_on_tile_clicked)

	building_popup.build_requested.connect(_on_build_requested)
	building_popup.upgrade_requested.connect(_on_upgrade_requested)
	building_popup.collect_requested.connect(_on_collect_requested)

func _on_tile_clicked(x: int, y: int, tile_type: String) -> void:
	var building: Dictionary = map_root.get_building_at(x, y)
	building_popup.show_for_selection(x, y, tile_type, building)

func _on_build_requested(x: int, y: int, tile_type: String) -> void:
	var success: bool = map_root.build_at(x, y, tile_type)

	if success:
		print("Build confirmed locally at (%d, %d) on %s" % [x, y, tile_type])
	else:
		print("Build failed locally at (%d, %d) on %s" % [x, y, tile_type])

func _on_upgrade_requested(x: int, y: int) -> void:
	var success: bool = map_root.upgrade_at(x, y)

	if success:
		print("Upgrade confirmed locally at (%d, %d)" % [x, y])
	else:
		print("Upgrade failed locally at (%d, %d)" % [x, y])

func _on_collect_requested(x: int, y: int) -> void:
	var collected: int = map_root.collect_at(x, y)

	print("Collected %d resources from building at (%d, %d)" % [collected, x, y])
