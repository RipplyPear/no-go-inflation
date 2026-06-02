class_name ClientConfig
extends RefCounted

const SERVER_HOST := "192.168.1.144"
const SERVER_PORT := "3000"

const API_BASE_URL := "http://" + SERVER_HOST + ":" + SERVER_PORT
const WS_BASE_URL := "ws://" + SERVER_HOST + ":" + SERVER_PORT + "/ws"

#const API_BASE_URL := "http://localhost:3000"
#const WS_BASE_URL := "ws://localhost:3000/ws"
