import * as TESTSPACE from './testspace';
import * as BOXING from './boxing';
const DefaultDream = BOXING.Boxing;

const DREAMS = {
    default: DefaultDream,
    [TESTSPACE.dreamId]: TESTSPACE.Testspace,
    [BOXING.dreamId]: BOXING.Boxing,
}

export default DREAMS;
