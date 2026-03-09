extends Node2D

@onready var map_root = $MapRoot
@onready var building_popup = $BuildingPopup

func _ready() -> void:
	map_root.tile_clicked.connect(_on_tile_clicked)
	building_popup.build_requested.connect(_on_build_requested)

func _on_tile_clicked(x: int, y: int, tile_type: String) -> void:
	building_popup.show_for_tile(x, y, tile_type)

func _on_build_requested(x: int, y: int, tile_type: String) -> void:
	print("Build requested at (%d, %d) on %s" % [x, y, tile_type])
