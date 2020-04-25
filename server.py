#!/usr/bin/env python3

import asyncio
import websockets
import uuid

channels = {}

async def server(websocket, path):
    websocket.id = str(uuid.uuid4())
    websocket.channel = path
    websocket.is_master = False
    websocket.data = {}


    if path not in channels.keys():
        channels[path] = {}
        websocket.is_master = True
    channels[path][websocket.id] = websocket
    channels[path]['syncId'] = 0

    print(f'[+][{"M" if websocket.is_master else " "}] {websocket.id} > {websocket.channel}')
    await websocket.send(f'0,5,{websocket.id}')
    if channels[path][websocket.id]['height'] is not None and channels[path][websocket.id]['width'] is not None:
        await websocket.send(f'0,3,{channels[path][websocket.id]["height"]},{channels[path][websocket.id]["width"]},2')

    async for message in websocket:
        for id in channels[websocket.channel]:
            message_parts = message.split(",")
            if message_parts[1] == '3':
                if websocket.is_master:
                    channels[path][websocket.id]["width"] = float(message_parts[2])
                    channels[path][websocket.id]["height"] = float(message_parts[3])
                    await websocket.send(f'0,3,{channels[path][websocket.id]["width"]},{channels[path][websocket.id]["height"]},0')
                    
            if websocket.id != id:
                await channels[websocket.channel][id].send(message)

start_server = websockets.serve(server, "0.0.0.0", 9000)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
