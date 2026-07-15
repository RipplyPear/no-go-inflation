class_name GameDomain
extends RefCounted

const RESOURCE_WOOD := "wood"
const RESOURCE_STONE := "stone"
const RESOURCE_GRAIN := "grain"
const RESOURCE_GALBENI := "galbeni"

const BASIC_RESOURCES := [RESOURCE_WOOD, RESOURCE_STONE, RESOURCE_GRAIN]
const PLAYER_RESOURCES := [RESOURCE_WOOD, RESOURCE_STONE, RESOURCE_GRAIN, RESOURCE_GALBENI]

const TILE_FOREST := "forest"
const TILE_FIELD := "field"
const TILE_QUARRY := "quarry"

const BUILDING_FARM := "farm"
const BUILDING_MINE := "mine"
const BUILDING_LUMBERYARD := "lumberyard"

const OFFER_BUY := "buy"
const OFFER_SELL := "sell"
const OFFER_TYPES := [OFFER_BUY, OFFER_SELL]

const TILE_LABEL_KEYS := {
	TILE_FIELD: "TILE_FIELD",
	TILE_QUARRY: "TILE_QUARRY",
	TILE_FOREST: "TILE_FOREST",
}

const RESOURCE_LABEL_KEYS := {
	RESOURCE_WOOD: "RESOURCE_WOOD",
	RESOURCE_STONE: "RESOURCE_STONE",
	RESOURCE_GRAIN: "RESOURCE_GRAIN",
	RESOURCE_GALBENI: "RESOURCE_GOLD",
}

const BUILDING_LABEL_KEYS := {
	BUILDING_FARM: "BUILDING_FARM",
	BUILDING_MINE: "BUILDING_MINE",
	BUILDING_LUMBERYARD: "BUILDING_LUMBERYARD",
}

const BUILDING_BY_TILE := {
	TILE_FIELD: BUILDING_FARM,
	TILE_QUARRY: BUILDING_MINE,
	TILE_FOREST: BUILDING_LUMBERYARD,
}

const RESOURCE_BY_BUILDING := {
	BUILDING_FARM: RESOURCE_GRAIN,
	BUILDING_MINE: RESOURCE_STONE,
	BUILDING_LUMBERYARD: RESOURCE_WOOD,
}


static func get_tile_label(tile_type: String) -> String:
	return TranslationServer.translate(str(TILE_LABEL_KEYS.get(tile_type, tile_type)))


static func get_resource_label(resource: String) -> String:
	return TranslationServer.translate(str(RESOURCE_LABEL_KEYS.get(resource, resource)))


static func get_building_label(building_type: String) -> String:
	return TranslationServer.translate(str(BUILDING_LABEL_KEYS.get(building_type, building_type)))
