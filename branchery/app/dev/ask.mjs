import { URLSearchParams } from 'node:url';

/**
 * A request as the interface makes it, and the answer as it reads it.
 *
 * What stands behind the question mark is taken off the path, as the server
 * does it: a route matches a path and never the query.
 */
export function call(api, method, path, payload = undefined, query = {}) {
    const [route, asked] = path.split('?');
    const answer = api.dispatch(method, route, payload === undefined ? '' : JSON.stringify(payload), {
        ...Object.fromEntries(new URLSearchParams(asked ?? '')),
        ...query,
    });

    return { status: answer.status, body: JSON.parse(answer.body) };
}
