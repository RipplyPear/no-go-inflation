class_name MapRoot
extends Node2D

const TILE_SIZE := Vector2(64, 64)

@export var map_file_path: String = "res://data/maps/static_map.json"

var map_data: Dictionary = {}

# Temporary local prototype state
# Will later come from the authoritative server
var buildings: Dictionary = {}

const TILE_TEXTURES := {
	"forest": preload("res://assets/tiles/forrest.png"),
	"field": preload("res://assets/tiles/soil.png"),
	"quarry": preload("res://assets/tiles/stone.png")
}

const TILE_TO_BUILDING := {
	"field": "farm",
	"quarry": "mine",
	"forest": "lumberyard"
}

const BUILDING_TEXTURES := {
	"farm": {
		1: preload("res://assets/buildings/farmer1.png"),
		2: preload("res://assets/buildings/farmer2.png"),
		3: preload("res://assets/buildings/farmer3.png")
	},
	"mine": {
		1: preload("res://assets/buildings/mine1.png"),
		2: preload("res://assets/buildings/mine2.png"),
		3: preload("res://assets/buildings/mine3.png")
	},
	"lumberyard": {
		1: preload("res://assets/buildings/forester1.png"),
		2: preload("res://assets/buildings/forester2.png"),
		3: preload("res://assets/buildings/forester3.png")
	}
}

signal tile_clicked(tile_x: int, tile_y: int, tile_type: String)

func _ready() -> void:
	if not GameState.map_data.is_empty():
		set_map_data(GameState.map_data)
	else:
		load_map()
		render_map()

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

func render_map() -> void:
	if not map_data.has("tiles"):
		return

	for child in get_children():
		child.queue_free()

	var rows: Array = map_data["tiles"]

	for y in range(rows.size()):
		var row: Array = rows[y]

		for x in range(row.size()):
			var tile_type: String = row[x]
			var tile := Area2D.new()
			tile.position = Vector2(x * TILE_SIZE.x, y * TILE_SIZE.y)

			var tile_sprite := Sprite2D.new()
			var tile_texture = TILE_TEXTURES.get(tile_type)

			if tile_texture == null:
				push_warning("No texture found for tile type: %s" % tile_type)
				continue

			tile_sprite.texture = tile_texture
			tile_sprite.centered = false
			tile.add_child(tile_sprite)

			var shape := CollisionShape2D.new()
			var rect := RectangleShape2D.new()
			rect.size = TILE_SIZE
			shape.shape = rect
			shape.position = TILE_SIZE / 2.0
			tile.add_child(shape)

			_render_building_on_tile(tile, x, y)

			tile.input_event.connect(_on_tile_input.bind(x, y, tile_type))
			add_child(tile)

func get_building_at(x: int, y: int) -> Dictionary:
	var key := Vector2i(x, y)

	if buildings.has(key):
		return buildings[key]

	return {}

func build_at(x: int, y: int, tile_type: String) -> bool:
	var key := Vector2i(x, y)

	if buildings.has(key):
		return false

	if not TILE_TO_BUILDING.has(tile_type):
		return false

	buildings[key] = {
		"type": TILE_TO_BUILDING[tile_type],
		"level": 1,
		"stored": 0
	}

	render_map()
	return true

func upgrade_at(x: int, y: int) -> bool:
	var key := Vector2i(x, y)

	if not buildings.has(key):
		return false

	var building: Dictionary = buildings[key]
	var level := int(building.get("level", 1))

	if level >= 3:
		return false

	building["level"] = level + 1
	buildings[key] = building

	render_map()
	return true

func collect_at(x: int, y: int) -> int:
	var key := Vector2i(x, y)

	if not buildings.has(key):
		return 0

	var building: Dictionary = buildings[key]
	var stored := int(building.get("stored", 0))

	building["stored"] = 0
	buildings[key] = building

	render_map()
	return stored

func _render_building_on_tile(tile: Area2D, x: int, y: int) -> void:
	var building := get_building_at(x, y)

	if building.is_empty():
		return

	var building_type := str(building.get("type", ""))
	var level := int(building.get("level", 1))

	if not BUILDING_TEXTURES.has(building_type):
		return

	var level_textures: Dictionary = BUILDING_TEXTURES[building_type]

	if not level_textures.has(level):
		return

	var building_sprite := Sprite2D.new()
	building_sprite.texture = level_textures[level]
	building_sprite.centered = false

	var texture_size := building_sprite.texture.get_size()
	if texture_size.x > 0 and texture_size.y > 0:
		building_sprite.scale = Vector2(
			TILE_SIZE.x / texture_size.x,
			TILE_SIZE.y / texture_size.y
		)

	tile.add_child(building_sprite)

func _on_tile_input(_viewport, event, _shape_idx, x: int, y: int, tile_type: String) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		tile_clicked.emit(x, y, tile_type)
		
		
func set_map_data(new_map_data: Dictionary) -> void:
	map_data = new_map_data
	render_map()
