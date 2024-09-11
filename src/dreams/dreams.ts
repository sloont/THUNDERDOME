import * as TESTSPACE from './Testspace';
const DefaultDream = TESTSPACE.Construct;

const DREAMS = {
    default: DefaultDream,
    [TESTSPACE.dreamId]: TESTSPACE.Construct,
}

export default DREAMS;
