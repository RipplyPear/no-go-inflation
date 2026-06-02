extends Control

const LOBBY_SCENE := "res://scenes/LobbyScreen.tscn"
const HOW_TO_PLAY_SCENE := "res://scenes/HowToPlayScreen.tscn"
const ABOUT_SCENE := "res://scenes/AboutScreen.tscn"
const START_MENU_SCENE := "res://scenes/StartMenu.tscn"

@onready var host_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/HostButton
@onready var join_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/JoinButton
@onready var how_to_play_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/HowToPlayButton
@onready var about_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/AboutButton
@onready var logout_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/LogoutButton
@onready var exit_button: Button = $CenterContainer/PanelContainer/MarginContainer/VBoxContainer/ExitButton


func _ready() -> void:
	host_button.pressed.connect(_on_host_pressed)
	join_button.pressed.connect(_on_join_pressed)
	how_to_play_button.pressed.connect(_on_how_to_play_pressed)
	about_button.pressed.connect(_on_about_pressed)
	logout_button.pressed.connect(_on_logout_pressed)
	exit_button.pressed.connect(_on_exit_pressed)


func _on_host_pressed() -> void:
	GameState.lobby_entry_mode = "host"
	get_tree().change_scene_to_file(LOBBY_SCENE)


func _on_join_pressed() -> void:
	GameState.lobby_entry_mode = "join"
	get_tree().change_scene_to_file(LOBBY_SCENE)


func _on_how_to_play_pressed() -> void:
	get_tree().change_scene_to_file(HOW_TO_PLAY_SCENE)


func _on_about_pressed() -> void:
	get_tree().change_scene_to_file(ABOUT_SCENE)


func _on_logout_pressed() -> void:
	logout_button.disabled = true
	GameSocket.disconnect_from_server()
	
	# WebSocketPeer mai face polling după close(),
	# ca serverul să observe deconectarea imediat.
	await get_tree().process_frame
	await get_tree().process_frame
	
	AuthClient.logout()
	GameState.reset()
	get_tree().change_scene_to_file(START_MENU_SCENE)


func _on_exit_pressed() -> void:
	get_tree().quit()
