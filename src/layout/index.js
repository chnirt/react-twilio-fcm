import React, { Fragment } from 'react'
import { Button } from '@chakra-ui/core'

import { useAuth } from '../context/useAuth'

export const Layout = ({ children }) => {
	const { logout } = useAuth()

	return (
		<Fragment>
			<Button onClick={logout} variantColor='teal' size='xs'>
				Logout
			</Button>
			<br />
			{children}
		</Fragment>
	)
}
