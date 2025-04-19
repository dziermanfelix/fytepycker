import json
from channels.generic.websocket import AsyncWebsocketConsumer


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
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', '')
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
        elif message_type == 'refetch_matchup':
            await self.send(text_data=json.dumps({
                'type': 'refetch_matchup',
                'message': 'Matchup has been updated. Please refresh.',
            }))

    async def broadcast_update(self, event):
        if event["sender"] != self.channel_name:
            await self.send(text_data=json.dumps({
                "type": "refetch_selections"
            }))

    async def refetch_matchup(self, event):
        await self.send(text_data=json.dumps({
            'type': 'refetch_matchup',
            'message': event.get('message', 'Matchup data has been refreshed'),
        }))
