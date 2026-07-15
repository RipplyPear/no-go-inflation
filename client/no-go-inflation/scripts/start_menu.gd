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
@onready var language_option_button: OptionButton = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/LanguageOptionButton

func _ready() -> void:
	login_button.pressed.connect(_on_login_pressed)
	register_button.pressed.connect(_on_register_pressed)
	about_button.pressed.connect(_on_about_pressed)
	exit_button.pressed.connect(_on_exit_pressed)
	server_config_button.pressed.connect(_on_server_config_pressed)
	_configure_language_selector()
	language_option_button.item_selected.connect(_on_language_selected)


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


func _configure_language_selector() -> void:
	language_option_button.clear()
	language_option_button.add_item("English")
	language_option_button.set_item_metadata(0, "en")
	language_option_button.add_item("Română")
	language_option_button.set_item_metadata(1, "ro")

	var selected_index := 0 if ClientConfig.get_language() == "en" else 1
	language_option_button.select(selected_index)


func _on_language_selected(index: int) -> void:
	var selected_language := str(language_option_button.get_item_metadata(index))

	if ClientConfig.set_language(selected_language) != OK:
		return

	get_tree().reload_current_scene()
