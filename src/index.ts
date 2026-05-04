import {
  engine,
  Transform,
  MeshRenderer,
  MeshCollider,
  TextShape,
  pointerEventsSystem,
  InputAction,
  Schemas
} from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { isServer, syncEntity, registerMessages } from '@dcl/sdk/network'
import { Storage } from '@dcl/sdk/server'

const Messages = {
  buttonClick: Schemas.Map({ t: Schemas.Int })
}
const room = registerMessages(Messages)

const counterEntity = engine.addEntity()


export async function main() {
  syncEntity(counterEntity, [TextShape.componentId], 1)

  if (isServer()) {
    await runServer()
  } else {
    runClient()
  }
}

async function runServer() {
  let count = 0

  const stored = await Storage.get('clickCount')
  if (stored !== null && stored !== undefined) {
    count = Number(stored)
  }

  TextShape.createOrReplace(counterEntity, {
    text: `Clicks: ${count}`,
    fontSize: 10
  })

  room.onMessage('buttonClick', (_data, context) => {
    if (!context) return        // ← add this
    count++
    TextShape.createOrReplace(counterEntity, {
      text: `Clicks: ${count}`,
      fontSize: 10
    })
    Storage.set('clickCount', String(count))    // ← set not put
    console.log(`Click from ${context.from} — total: ${count}`)
  })
}

function runClient() {
  Transform.createOrReplace(counterEntity, {
    position: Vector3.create(8, 3.5, 8)
  })

  /* TextShape.createOrReplace(counterEntity, {
    text: 'Clicks: 0',
    fontSize: 10
  }) */

  const button = engine.addEntity()
  Transform.create(button, { position: Vector3.create(8, 1, 8) })
  MeshRenderer.setBox(button)
  MeshCollider.setBox(button)

  pointerEventsSystem.onPointerDown(
    { entity: button, opts: { button: InputAction.IA_POINTER, hoverText: 'Click!' } },
    () => { room.send('buttonClick', { t: Date.now() }) }
  )
}