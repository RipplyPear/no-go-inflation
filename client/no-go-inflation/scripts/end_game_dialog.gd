class_name EndGameDialog
extends AcceptDialog


func show_results(final_result: Dictionary) -> void:
	title = "Rezultatul sesiunii"
	dialog_text = _build_result_text(final_result)
	popup_centered()


func _build_result_text(final_result: Dictionary) -> String:
	var collective_result := str(final_result.get("collectiveResult", "loss"))
	var final_inflation := int(final_result.get("finalInflation", 0))
	var average_score := int(final_result.get("averageEconomicScore", 0))
	var results = final_result.get("results", [])

	var result_label := "VICTORIE" if collective_result == "win" else "ÎNFRÂNGERE"

	var text := "Final de joc: %s\n" % result_label
	text += "Inflație finală: %d\n" % final_inflation
	text += "Scor economic mediu: %d\n\n" % average_score
	text += "Rezultate jucători:\n"

	if typeof(results) != TYPE_ARRAY or results.is_empty():
		text += "- Nu există rezultate individuale disponibile.\n"
		return text

	for result in results:
		if typeof(result) != TYPE_DICTIONARY:
			continue

		text += _build_player_result_line(result)

	return text


func _build_player_result_line(result: Dictionary) -> String:
	return "- %s | scor: %d | rang: %s | tranzacții: %d | valoare: %d\n" % [
		str(result.get("displayName", "Jucător")),
		int(result.get("economicScore", 0)),
		str(result.get("rank", "D")),
		int(result.get("tradesCount", 0)),
		int(result.get("totalTradedValue", 0)),
	]
