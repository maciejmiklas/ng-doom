import {testFunctions as tf} from "./three-builder";

describe('three-builder#boxPaths', () => {

	it('indigo', () => {
		const paths = tf.boxPaths('indigo', 'png')
		expect(paths.length).toEqual(6)
		expect(paths[0]).toEqual('./assets/sky/indigo/ft.png')
		expect(paths[1]).toEqual('./assets/sky/indigo/bk.png')
		expect(paths[2]).toEqual('./assets/sky/indigo/up.png')
		expect(paths[3]).toEqual('./assets/sky/indigo/dn.png')
		expect(paths[4]).toEqual('./assets/sky/indigo/rt.png')
		expect(paths[5]).toEqual('./assets/sky/indigo/lf.png')
	})

})
