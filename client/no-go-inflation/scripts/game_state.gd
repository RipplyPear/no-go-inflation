extends Node

var session_id: String = ""
var lobby_code: String = ""
var participant_id: String = ""

var current_day: int = 1
var current_minute: int = 480

var resources: Dictionary = {
	"wood": 0,
	"stone": 0,
	"grain": 0,
	"galbeni": 0,
}

var economy: Dictionary = {
	"inflation": 20,
	"averagePrices": {
		"wood": 1,
		"stone": 1,
		"grain": 1,
	}
}

var map_data: Dictionary = {}
var buildings: Array = []

func load_session_state(payload: Dictionary) -> void:
	session_id = str(payload.get("sessionId", ""))
	lobby_code = str(payload.get("lobbyCode", ""))

	current_day = int(payload.get("currentDay", 1))
	current_minute = int(payload.get("currentMinute", 480))

	var participant: Dictionary = payload.get("participant", {})
	participant_id = str(participant.get("id", ""))

	resources = payload.get("resources", resources)
	economy = payload.get("economy", economy)
	map_data = payload.get("map", {})
	
	var payload_buildings = payload.get("buildings", [])

	if typeof(payload_buildings) == TYPE_ARRAY:
		buildings = payload_buildings
	else:
		buildings = []

	print("GameState loaded session: ", session_id)
	print("Resources: ", resources)
	print("Economy: ", economy)
	print("Buildings: ", buildings)
