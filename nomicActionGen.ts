import { Action, ActionType } from "./nomicRulesetGen.ts";

const actionsText = await Deno.readTextFile("./actions.json");
const actions: Action[] = JSON.parse(actionsText);
const newAction = await Deno.readTextFile(Deno.args[0]);
let type: ActionType | undefined;
let id: number | undefined;
let author: string | undefined;
let target: number | undefined;
let content: string | undefined = "";

console.log(newAction.split("\n"));

for (const line of newAction.split("\n")) {
	if (id === undefined && line.match(/\d+/)) {
		id = parseInt(line.match(/\d+/)![0]);
		continue;
	}
	if (type === undefined && line.match(/amend|enact|repeal|transmute/i)) {
		type = {
			amend: ActionType.AMEND,
			enact: ActionType.ENACT,
			repeal: ActionType.REPEAL,
			transmute: ActionType.TRANSMUTE
		}[line.match(/amend|enact|repeal|transmute/i)![0].toLowerCase()];
		continue;
	}
	if (
		target === undefined &&
		line.match(/\d+/) &&
		[ActionType.TRANSMUTE, ActionType.AMEND].includes(type!)
	) {
		target = parseInt(line.match(/\d+/)![0]);
		continue;
	}
	if (author === undefined && line.match(/\w+/)) {
		author = line;
		continue;
	}
	if ([ActionType.ENACT, ActionType.AMEND].includes(type!)) {
		content += line + "\n";
	}
}

if (type === undefined) throw new Error("No action type specified");
if (id === undefined) throw new Error("No action id specified");
if (author === undefined) throw new Error("No action author specified");

actions.push({
	type,
	id,
	author,
	target,
	content: content === "" ? undefined : content
});

Deno.writeTextFile("./actions.json", JSON.stringify(actions, null, "\t"));
