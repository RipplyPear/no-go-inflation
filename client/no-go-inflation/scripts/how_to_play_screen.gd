extends Control

const PLAYER_MENU_SCENE := "res://scenes/PlayerMenuScreen.tscn"

@onready var back_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/BackButton


func _ready() -> void:
	back_button.pressed.connect(_on_back_pressed)


func _on_back_pressed() -> void:
	get_tree().change_scene_to_file(PLAYER_MENU_SCENE)
