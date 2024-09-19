import * as TESTSPACE from './testspace';
const DefaultDream = TESTSPACE.Construct;

const DREAMS = {
    default: DefaultDream,
    [TESTSPACE.dreamId]: TESTSPACE.Construct,
}

export default DREAMS;
