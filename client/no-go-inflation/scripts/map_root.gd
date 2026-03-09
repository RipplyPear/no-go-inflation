extends Node2D

const TILE_SIZE := Vector2(64, 64)

@export var map_file_path: String = "res://data/maps/static_map.json"

var map_data: Dictionary = {}
var tile_nodes: Array = []

const TILE_TEXTURES := {
	"forest": preload("res://assets/tiles/forrest.png"),
	"field": preload("res://assets/tiles/soil.png"),
	"quarry": preload("res://assets/tiles/stone.png")
}

signal tile_clicked(tile_x: int, tile_y: int, tile_type: String)


# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	load_map()
	render_map()

func load_map() -> void:
	var file = FileAccess.open(map_file_path, FileAccess.READ)
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
	
	# Resetting children
	for child in get_children():
		child.queue_free()
	
	var rows: Array = map_data["tiles"]
	
	for y in range(rows.size()):
		var row: Array = rows[y]
		for x in range(row.size()):
			var tile_type: String = row[x]
			var tile := Area2D.new()
			tile.position = Vector2(x * TILE_SIZE.x, y * TILE_SIZE.y)

			var sprite := Sprite2D.new()
			sprite.texture = TILE_TEXTURES.get(tile_type)
			sprite.centered = false
			tile.add_child(sprite)

			var shape := CollisionShape2D.new()
			var rect := RectangleShape2D.new()
			rect.size = TILE_SIZE
			shape.shape = rect
			shape.position = TILE_SIZE / 2.0
			tile.add_child(shape)

			tile.input_event.connect(_on_tile_input.bind(x, y, tile_type))
			add_child(tile)
			
func _on_tile_input(_viewport, event, _shape_idx, x: int, y: int, tile_type: String) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		tile_clicked.emit(x, y, tile_type)
