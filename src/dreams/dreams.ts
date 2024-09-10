import * as TESTSPACE from "./testspace";
const defaultDream = TESTSPACE;
const dreams = {
    default: { name: defaultDream.name, init: defaultDream.init },
    [TESTSPACE.name]: { name: TESTSPACE.name, init: TESTSPACE.init },
}
export default dreams;