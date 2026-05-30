extends Node

signal state_changed

const DEFAULT_RESOURCES := {
	GameDomain.RESOURCE_WOOD: 0,
	GameDomain.RESOURCE_STONE: 0,
	GameDomain.RESOURCE_GRAIN: 0,
	GameDomain.RESOURCE_GALBENI: 0,
}

const DEFAULT_ECONOMY := {
	"inflation": 20,
	"averagePrices": {
		GameDomain.RESOURCE_WOOD: 1.0,
		GameDomain.RESOURCE_STONE: 1.0,
		GameDomain.RESOURCE_GRAIN: 1.0,
	}
}

var session_id: String = ""
var lobby_code: String = ""
var participant_id: String = ""

var current_day: int = 1
var current_minute: int = 480

var resources: Dictionary = DEFAULT_RESOURCES.duplicate(true)
var economy: Dictionary = DEFAULT_ECONOMY.duplicate(true)

var map_data: Dictionary = {}
var buildings: Array = []


func has_active_session() -> bool:
	return not session_id.is_empty()


func reset() -> void:
	session_id = ""
	lobby_code = ""
	participant_id = ""

	current_day = 1
	current_minute = 480

	resources = DEFAULT_RESOURCES.duplicate(true)
	economy = DEFAULT_ECONOMY.duplicate(true)

	map_data = {}
	buildings = []

	state_changed.emit()


func load_session_state(payload: Dictionary) -> void:
	session_id = str(payload.get("sessionId", session_id))
	lobby_code = str(payload.get("lobbyCode", lobby_code))

	current_day = int(payload.get("currentDay", current_day))
	current_minute = int(payload.get("currentMinute", current_minute))

	_load_participant(payload)
	_load_resources(payload)
	_load_economy(payload)
	_load_map(payload)
	_load_buildings(payload)

	print("GameState loaded session: ", session_id)
	state_changed.emit()


func get_resource_amount(resource_name: String) -> int:
	return int(resources.get(resource_name, 0))


func get_inflation() -> int:
	return int(economy.get("inflation", 20))


func get_average_price(resource_name: String) -> float:
	var average_prices: Dictionary = economy.get("averagePrices", {})
	return float(average_prices.get(resource_name, 1.0))


func _load_participant(payload: Dictionary) -> void:
	var participant = payload.get("participant", {})

	if typeof(participant) != TYPE_DICTIONARY:
		participant_id = ""
		return

	participant_id = str(participant.get("id", participant_id))


func _load_resources(payload: Dictionary) -> void:
	var payload_resources = payload.get("resources", {})

	if typeof(payload_resources) != TYPE_DICTIONARY:
		return

	var next_resources := DEFAULT_RESOURCES.duplicate(true)

	for resource_name in DEFAULT_RESOURCES.keys():
		next_resources[resource_name] = int(payload_resources.get(resource_name, DEFAULT_RESOURCES[resource_name]))

	resources = next_resources


func _load_economy(payload: Dictionary) -> void:
	var payload_economy = payload.get("economy", {})

	if typeof(payload_economy) != TYPE_DICTIONARY:
		return

	var next_economy := DEFAULT_ECONOMY.duplicate(true)

	next_economy["inflation"] = int(payload_economy.get("inflation", DEFAULT_ECONOMY["inflation"]))

	var payload_average_prices = payload_economy.get("averagePrices", {})
	var next_average_prices: Dictionary = next_economy["averagePrices"]

	if typeof(payload_average_prices) == TYPE_DICTIONARY:
		for resource_name in next_average_prices.keys():
			next_average_prices[resource_name] = float(payload_average_prices.get(resource_name, next_average_prices[resource_name]))

	economy = next_economy


func _load_map(payload: Dictionary) -> void:
	var payload_map = payload.get("map", {})

	if typeof(payload_map) == TYPE_DICTIONARY:
		map_data = payload_map
	else:
		map_data = {}


func _load_buildings(payload: Dictionary) -> void:
	var payload_buildings = payload.get("buildings", [])

	if typeof(payload_buildings) == TYPE_ARRAY:
		buildings = payload_buildings
	else:
		buildings = []
