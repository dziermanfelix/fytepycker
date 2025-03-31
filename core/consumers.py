import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer


class SelectionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.matchup_id = self.scope['url_route']['kwargs']['matchup_id']
        self.room_group_name = f'matchup_{self.matchup_id}'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('action') == 'wsUpdateSelections':
            selections = data.get('selections')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_update",
                    "selections": selections,
                    "sender": self.channel_name,
                }
            )

    async def broadcast_update(self, event):
        if event["sender"] != self.channel_name:
            await self.send(text_data=json.dumps({
                "selections": event["selections"]
            }))
