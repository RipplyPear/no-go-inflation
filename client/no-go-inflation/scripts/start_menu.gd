extends Control

const LOGIN_SCENE := "res://scenes/LoginScreen.tscn"
const REGISTER_SCENE := "res://scenes/RegisterScreen.tscn"
const ABOUT_SCENE := "res://scenes/AboutScreen.tscn"
const SERVER_CONFIG_SCENE := "res://scenes/ServerConfigScreen.tscn"

@onready var login_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/LoginButton
@onready var register_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/RegisterButton
@onready var about_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/AboutButton
@onready var exit_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/ExitButton
@onready var server_config_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/ServerConfigButton

func _ready() -> void:
	login_button.pressed.connect(_on_login_pressed)
	register_button.pressed.connect(_on_register_pressed)
	about_button.pressed.connect(_on_about_pressed)
	exit_button.pressed.connect(_on_exit_pressed)
	server_config_button.pressed.connect(_on_server_config_pressed)


func _on_login_pressed() -> void:
	get_tree().change_scene_to_file(LOGIN_SCENE)


func _on_register_pressed() -> void:
	get_tree().change_scene_to_file(REGISTER_SCENE)


func _on_about_pressed() -> void:
	get_tree().change_scene_to_file(ABOUT_SCENE)


func _on_exit_pressed() -> void:
	get_tree().quit()


func _on_server_config_pressed() -> void:
	get_tree().change_scene_to_file(SERVER_CONFIG_SCENE)
