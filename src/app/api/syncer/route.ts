import { NextRequest, NextResponse } from 'next/server'
import { ModelName, UnknownPayload } from 'lib/syncer/types'
import { performClientDiff } from 'lib/syncer/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'app/api/auth/constants'

export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions)

	if (!session) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const body = await req.json() as {
        scopeName: ModelName
        lastServerUpdate: Date
        items: UnknownPayload[]
    }
	const response = {}

	const { scopeName, lastServerUpdate, items } = body

	if (!scopeName || !items) return NextResponse.json(response, { status: 200 })

	try {
		await performClientDiff(scopeName, {
			diff: {
				create: items,
			},
			lastServerUpdate,
		})
	} catch (error) {
		return NextResponse.json({ error }, { status: 500 })
	}

	return NextResponse.json(response, { status: 200 })
}