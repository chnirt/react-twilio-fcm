import React, { Suspense, lazy } from 'react'

import { Loading } from '../components'

export const Loadable = ({ url = '', ...rest }) => {
	const MyComponent = lazy(() => {
		return import(url).then((m) => ({
			default: m[url.split('/').pop() || ''],
		}))
	})
	return (
		<Suspense fallback={<Loading />}>
			<MyComponent {...rest} />
		</Suspense>
	)
}
