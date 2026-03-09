extends CanvasLayer

signal build_requested(x: int, y: int, tile_type: String)

const TILE_SIZE := Vector2(64, 64)
var selected_x: int = -1
var selected_y: int = -1
var selected_tile_type: String = ""

@onready var panel: PanelContainer = $PanelContainer
@onready var title_label: Label = $PanelContainer/MarginContainer/VBoxContainer/TitleLabel
@onready var info_label: Label = $PanelContainer/MarginContainer/VBoxContainer/InfoLabel
@onready var build_button: Button = $PanelContainer/MarginContainer/VBoxContainer/BuildButton
@onready var close_button: Button = $PanelContainer/MarginContainer/VBoxContainer/CloseButton

func _ready() -> void:
	panel.visible = false
	build_button.pressed.connect(_on_build_pressed)
	close_button.pressed.connect(hide_popup)

func show_for_tile(x: int, y: int, tile_type: String) -> void:
	set_offset(Vector2(x * TILE_SIZE.x, (y + 1) * TILE_SIZE.y))
	
	selected_x = x
	selected_y = y
	selected_tile_type = tile_type

	title_label.text = "Tile (%d, %d)" % [x, y]
	info_label.text = "Type: %s" % tile_type

	panel.visible = true

func hide_popup() -> void:
	panel.visible = false

func _on_build_pressed() -> void:
	build_requested.emit(selected_x, selected_y, selected_tile_type)
	hide_popup()
