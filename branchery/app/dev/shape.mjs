/**
 * Whether an answer is the shape api-answers.json says it is.
 *
 * The twin of tests/Contract/Shape.php, which reads the same file and says the
 * same things about the container's own answers. Two readers rather than one
 * because there is no language both halves are written in -- but one source,
 * which is the whole point: a field added to the container and not to the mock
 * used to read exactly as a field added to both.
 */

/**
 * Every way the value is not what the type says, as sentences. An empty list is
 * an answer of the right shape.
 *
 * @param seen a set the names of the shapes actually walked are added to, so a
 *             caller can tell a shape that was checked from one that was only
 *             written down -- an empty list checks nothing, silently.
 */
export function mismatches(value, type, shapes, where = 'the answer', seen = new Set()) {
    if (type.startsWith('?')) {
        return value === null ? [] : mismatches(value, type.slice(1), shapes, where, seen);
    }

    if (type.startsWith('[') && type.endsWith(']')) {
        if (!Array.isArray(value)) {
            return [`${where} is ${nameOf(value)} where a list of ${type.slice(1, -1)} was expected`];
        }

        return value.flatMap((entry, at) => mismatches(entry, type.slice(1, -1), shapes, `${where}[${at}]`, seen));
    }

    if (type.startsWith('@')) {
        return object(value, type.slice(1), shapes, where, seen);
    }

    return primitive(value, type, where);
}

function object(value, name, shapes, where, seen) {
    const fields = shapes[name];
    if (fields === undefined) {
        return [`${where} is said to be "${name}", which is not one of the shapes`];
    }
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return [`${where} is ${nameOf(value)} where ${name} was expected`];
    }
    seen.add(name);

    const found = [];
    for (const [field, type] of Object.entries(fields)) {
        if (!(field in value)) {
            found.push(`${where}.${field} is missing; ${name} has it`);

            continue;
        }
        found.push(...mismatches(value[field], type, shapes, `${where}.${field}`, seen));
    }
    // The other way round as well: an answer carrying more than the shape says
    // is what makes an interface written against a mock work against a lie.
    for (const field of Object.keys(value)) {
        if (!(field in fields)) {
            found.push(`${where}.${field} is not part of ${name}`);
        }
    }

    return found;
}

function primitive(value, type, where) {
    const holds = {
        string: (given) => typeof given === 'string',
        int: (given) => Number.isInteger(given),
        bool: (given) => typeof given === 'boolean',
        mixed: () => true,
    }[type];

    if (holds === undefined) {
        return [`${where} is said to be "${type}", which is not a type`];
    }

    return holds(value) ? [] : [`${where} is ${nameOf(value)} where ${type} was expected`];
}

function nameOf(value) {
    if (value === null) {
        return 'null';
    }

    return Array.isArray(value) ? 'a list' : typeof value;
}
