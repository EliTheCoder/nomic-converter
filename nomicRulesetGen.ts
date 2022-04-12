const initialRulesetText = await Deno.readTextFile("./initial.json");
const actionsText = await Deno.readTextFile("./actions.json");
const ruleset: Rule[] = JSON.parse(initialRulesetText);
const actions: Action[] = JSON.parse(actionsText);

enum ActionType {
	ENACT,
	REPEAL,
	TRANSMUTE,
	AMEND
}

type Rule = {
	id: number;
	immutable: boolean;
	content: string;
	previous?: number[];
	author?: string;
};

type Action = {
	type: ActionType;
	id: number;
	author: string;
	target?: number;
	content?: string;
};

for (let i = 0; i < actions.length; i++) {
	const action = actions[i];
	switch (action.type) {
		case ActionType.ENACT:
			if (action.content === undefined)
				throw new Error(`Enactment ${i} is missing content`);
			ruleset.push({
				id: action.id,
				immutable: false,
				content: action.content,
				author: action.author
			});
			break;
		case ActionType.REPEAL: {
			if (action.target === undefined)
				throw new Error(`Repeal ${i} is missing target`);
			const targetIndex = ruleset.findIndex(
				rule => rule.id === action.target
			);
			if (targetIndex === -1)
				throw new Error(
					`Repeal ${i} target ${action.target} not found`
				);
			const target = ruleset[targetIndex];
			if (target.immutable)
				throw new Error(
					`Repeal ${i} target ${action.target} is immutable`
				);
			ruleset.splice(targetIndex, 1);
			break;
		}
		case ActionType.TRANSMUTE: {
			if (action.target === undefined)
				throw new Error(`Transmutation ${i} is missing target`);
			const targetIndex = ruleset.findIndex(
				rule => rule.id === action.target
			);
			if (targetIndex === -1)
				throw new Error(
					`Transmutation ${i} target ${action.target} not found`
				);
			const target = ruleset[targetIndex];
			if (target.immutable) {
				ruleset.splice(targetIndex, 1);
				ruleset.push({
					id: action.id,
					immutable: false,
					content: target.content,
					author: action.author,
					previous: [...(target.previous ?? []), target.id]
				});
			} else {
				ruleset.splice(targetIndex, 1);
				ruleset.push({
					id: action.id,
					immutable: true,
					content: target.content,
					author: action.author,
					previous: [...(target.previous ?? []), target.id]
				});
			}
			break;
		}
		case ActionType.AMEND: {
			if (action.target === undefined)
				throw new Error(`Amendment ${i} is missing target`);
			const targetIndex = ruleset.findIndex(
				rule => rule.id === action.target
			);
			if (targetIndex === -1)
				throw new Error(
					`Amendment ${i} target ${action.target} not found`
				);
			const target = ruleset[targetIndex];
			if (target.immutable)
				throw new Error(
					`Amendment ${i} target ${action.target} is immutable`
				);
			if (action.content === undefined)
				throw new Error(`Amendment ${i} is missing content`);
			ruleset.splice(targetIndex, 1);
			ruleset.push({
				id: action.id,
				immutable: false,
				content: action.content,
				author: action.author,
				previous: [...(target.previous ?? []), target.id]
			});
			break;
		}
		default:
			throw new Error(`Unknown action type ${action.type}`);
	}
}

await Deno.writeTextFile(
	"./ruleset.json",
	JSON.stringify(
		ruleset.sort((a, b) => a.id - b.id),
		null,
		2
	)
);
