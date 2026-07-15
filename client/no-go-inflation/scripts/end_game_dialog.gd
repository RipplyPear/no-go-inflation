class_name EndGameDialog
extends AcceptDialog


func show_results(final_result: Dictionary) -> void:
	title = tr("RESULT_TITLE")
	dialog_text = _build_result_text(final_result)
	popup_centered()


func _build_result_text(final_result: Dictionary) -> String:
	var collective_result := str(final_result.get("collectiveResult", "loss"))
	var results = final_result.get("results", [])
	var result_label := tr("RESULT_WIN") if collective_result == "win" else tr("RESULT_LOSS")
	var text := tr("RESULT_SUMMARY").format({
		"result": result_label,
		"inflation": int(final_result.get("finalInflation", 0)),
		"score": int(final_result.get("averageEconomicScore", 0)),
	}) + "\n"
	if typeof(results) != TYPE_ARRAY or results.is_empty():
		return text + "- " + tr("RESULT_NO_INDIVIDUAL") + "\n"
	for result in results:
		if typeof(result) == TYPE_DICTIONARY:
			text += _build_player_result_line(result)
	return text


func _build_player_result_line(result: Dictionary) -> String:
	return tr("RESULT_PLAYER_LINE").format({
		"name": str(result.get("displayName", tr("LOBBY_DEFAULT_PLAYER"))),
		"score": int(result.get("economicScore", 0)),
		"rank": str(result.get("rank", "D")),
		"trades": int(result.get("tradesCount", 0)),
		"value": int(result.get("totalTradedValue", 0)),
	}) + "\n"
