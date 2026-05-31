class_name MapRoot
extends Node2D

signal tile_clicked(tile_x: int, tile_y: int, tile_type: String)

const TILE_SIZE := Vector2(64, 64)

@export var map_file_path: String = "res://data/maps/static_map.json"

var map_data: Dictionary = {}

# Client-side view of the authoritative server state.
# Gameplay actions are validated and applied by the server.
var buildings: Dictionary = {}

var _generated_map_root: Node2D

const TILE_TEXTURES := {
	GameDomain.TILE_FOREST: preload("res://assets/tiles/forest.png"),
	GameDomain.TILE_FIELD: preload("res://assets/tiles/soil.png"),
	GameDomain.TILE_QUARRY: preload("res://assets/tiles/stone.png") 
}

const BUILDING_TEXTURES := {
	GameDomain.BUILDING_FARM: {
		1: preload("res://assets/buildings/farmer1.png"),
		2: preload("res://assets/buildings/farmer2.png"),
		3: preload("res://assets/buildings/farmer3.png")
	},
	GameDomain.BUILDING_MINE: {
		1: preload("res://assets/buildings/mine1.png"),
		2: preload("res://assets/buildings/mine2.png"),
		3: preload("res://assets/buildings/mine3.png")
	},
	GameDomain.BUILDING_LUMBERYARD: {
		1: preload("res://assets/buildings/forester1.png"),
		2: preload("res://assets/buildings/forester2.png"),
		3: preload("res://assets/buildings/forester3.png")
	}
}


func _ready() -> void:
	_setup_generated_map_root()
	
	if map_data.is_empty():
		load_map()
	
	render_map()


func _setup_generated_map_root() -> void:
	_generated_map_root = Node2D.new()
	_generated_map_root.name = "GeneratedMapRoot"
	add_child(_generated_map_root)


func load_map() -> void:
	var file := FileAccess.open(map_file_path, FileAccess.READ)
	
	if file == null:
		push_error("Could not open map file at " + map_file_path)
		return
	
	var parsed = JSON.parse_string(file.get_as_text())
	
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Invalid JSON in map file")
		return
	
	map_data = parsed


func apply_server_state(new_map_data: Dictionary, server_buildings: Array) -> void:
	if new_map_data.is_empty() or not new_map_data.has("tiles"):
		return
	
	map_data = new_map_data
	_load_buildings_from_server(server_buildings)
	render_map()


func render_map() -> void:
	if not _has_valid_map_tiles():
		return
	
	_clear_map()
	
	var rows: Array = map_data["tiles"]
	
	for y in range(rows.size()):
		var row = rows[y]
		
		if typeof(row) != TYPE_ARRAY:
			continue
		
		for x in range(row.size()):
			var tile_type := str(row[x])
			var tile := _create_tile(x, y, tile_type)
		
			if tile == null:
				continue
			
			_generated_map_root.add_child(tile)


func get_building_at(x: int, y: int) -> Dictionary:
	var key := Vector2i(x, y)
	
	if buildings.has(key):
		return buildings[key]
	
	return {}


func _has_valid_map_tiles() -> bool:
	return map_data.has("tiles") and typeof(map_data["tiles"]) == TYPE_ARRAY


func _clear_map() -> void:
	if _generated_map_root == null:
		_setup_generated_map_root()
	
	for child in _generated_map_root.get_children():
		child.queue_free()


func _load_buildings_from_server(server_buildings: Array) -> void:
	buildings.clear()
	
	for item in server_buildings:
		if typeof(item) != TYPE_DICTIONARY:
			continue
	
		_add_building_from_server_data(item)


func _add_building_from_server_data(building_data: Dictionary) -> void:
	var x := int(building_data.get("x", -1))
	var y := int(building_data.get("y", -1))
	
	if x < 0 or y < 0:
		return
	
	var key := Vector2i(x, y)
	
	buildings[key] = {
		"type": str(building_data.get("type", "")),
		"level": int(building_data.get("level", 1)),
		"stored": int(building_data.get("stored", 0))
	}


func _create_tile(x: int, y: int, tile_type: String) -> Area2D:
	if not TILE_TEXTURES.has(tile_type):
		push_warning("No texture found for tile type: %s" % tile_type)
		return null
	
	var tile := Area2D.new()
	tile.position = Vector2(x * TILE_SIZE.x, y * TILE_SIZE.y)
	
	tile.add_child(_create_tile_sprite(tile_type))
	tile.add_child(_create_tile_collision())
	
	_render_building_on_tile(tile, x, y)
	
	tile.input_event.connect(_on_tile_input.bind(x, y, tile_type))
	
	return tile


func _create_tile_sprite(tile_type: String) -> Sprite2D:
	var tile_sprite := Sprite2D.new()
	tile_sprite.texture = TILE_TEXTURES[tile_type]
	tile_sprite.centered = false
	
	return tile_sprite


func _create_tile_collision() -> CollisionShape2D:
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	
	rect.size = TILE_SIZE
	
	shape.shape = rect
	shape.position = TILE_SIZE / 2.0
	
	return shape


func _render_building_on_tile(tile: Area2D, x: int, y: int) -> void:
	var building := get_building_at(x, y)
	
	if building.is_empty():
		return
	
	var building_sprite := _create_building_sprite(building)
	
	if building_sprite == null:
		return
	
	tile.add_child(building_sprite)


func _create_building_sprite(building: Dictionary) -> Sprite2D:
	var building_type := str(building.get("type", ""))
	var level := int(building.get("level", 1))
	
	if not BUILDING_TEXTURES.has(building_type):
		return null
	
	var level_textures: Dictionary = BUILDING_TEXTURES[building_type]
	
	if not level_textures.has(level):
		return null
	
	var building_sprite := Sprite2D.new()
	building_sprite.texture = level_textures[level]
	building_sprite.centered = false
	
	_scale_sprite_to_tile(building_sprite)
	
	return building_sprite


func _scale_sprite_to_tile(sprite: Sprite2D) -> void:
	if sprite.texture == null:
		return
	
	var texture_size := sprite.texture.get_size()
	
	if texture_size.x <= 0 or texture_size.y <= 0:
		return
	
	sprite.scale = Vector2(
		TILE_SIZE.x / texture_size.x,
		TILE_SIZE.y / texture_size.y
	)


func _on_tile_input(
	_viewport,
	event,
	_shape_idx,
	x: int,
	y: int,
	tile_type: String
) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		tile_clicked.emit(x, y, tile_type)
