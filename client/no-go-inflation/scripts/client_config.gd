extends Node

const DEFAULT_HOST := "localhost"
const SERVER_PORT := 3000

const CONFIG_PATH := "user://server.cfg"
const CONFIG_SECTION := "network"
const CONFIG_HOST_KEY := "server_host"
const DEFAULT_LANGUAGE := "en"
const PREFERENCES_SECTION := "preferences"
const LANGUAGE_KEY := "language"

var language: String = DEFAULT_LANGUAGE
var server_host: String = DEFAULT_HOST


func _ready() -> void:
	_load_server_host()
	print("Configured server: ", get_api_base_url())
	_load_language()
	TranslationServer.set_locale(language)


func get_server_host() -> String:
	return server_host


func get_api_base_url() -> String:
	return "http://%s:%d" % [server_host, SERVER_PORT]


func get_ws_base_url() -> String:
	return "ws://%s:%d/ws" % [server_host, SERVER_PORT]


func set_server_host(value: String) -> Error:
	server_host = normalize_server_host(value)
	return _save_server_host()


func normalize_server_host(value: String) -> String:
	var normalized := value.strip_edges()
	
	if normalized.is_empty():
		return DEFAULT_HOST
	
	return normalized


func _load_server_host() -> void:
	var config := ConfigFile.new()
	var load_error := config.load(CONFIG_PATH)
	
	if load_error != OK:
		server_host = DEFAULT_HOST
		return
	
	var saved_host = config.get_value(
		CONFIG_SECTION,
		CONFIG_HOST_KEY,
		DEFAULT_HOST
	)
	
	server_host = normalize_server_host(str(saved_host))


func _save_server_host() -> Error:
	var config := ConfigFile.new()
	
	# Dacă fișierul există, încărcăm și păstrăm eventualele alte setări.
	config.load(CONFIG_PATH)
	
	config.set_value(
		CONFIG_SECTION,
		CONFIG_HOST_KEY,
		server_host
	)
	
	return config.save(CONFIG_PATH)


func get_language() -> String:
	return language


func set_language(new_language: String) -> Error:
	if new_language not in ["en", "ro"]:
		return ERR_INVALID_PARAMETER

	language = new_language
	TranslationServer.set_locale(language)
	return _save_language()


func _load_language() -> void:
	var config := ConfigFile.new()
	if config.load(CONFIG_PATH) != OK:
		return

	language = str(config.get_value(
		PREFERENCES_SECTION,
		LANGUAGE_KEY,
		DEFAULT_LANGUAGE
	))

	if language not in ["en", "ro"]:
		language = DEFAULT_LANGUAGE


func _save_language() -> Error:
	var config := ConfigFile.new()
	config.load(CONFIG_PATH)
	config.set_value(PREFERENCES_SECTION, LANGUAGE_KEY, language)
	return config.save(CONFIG_PATH)
