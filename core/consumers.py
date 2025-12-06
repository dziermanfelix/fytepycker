import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class SelectionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.matchup_id = self.scope['url_route']['kwargs']['matchup_id']
            self.room_group_name = f'matchup_{self.matchup_id}'

            # Log connection attempt
            user = self.scope.get('user', None)
            logger.info(f"WebSocket connection attempt for matchup {self.matchup_id}, user: {user}")

            # Add to channel layer group
            if self.channel_layer:
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
            else:
                logger.warning("Channel layer not available, WebSocket will work but without group messaging")

            await self.accept()
            logger.info(f"WebSocket connected for matchup {self.matchup_id}")
        except Exception as e:
            logger.error(f"Error connecting WebSocket for matchup {self.matchup_id}: {e}", exc_info=True)
            # Still accept the connection even if group_add fails
            # This allows the WebSocket to work without Redis/channel layers
            await self.accept()

    async def disconnect(self, close_code):
        try:
            if self.channel_layer:
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
            logger.info(f"WebSocket disconnected for matchup {self.matchup_id}, close_code: {close_code}")
        except Exception as e:
            logger.error(f"Error disconnecting WebSocket for matchup {self.matchup_id}: {e}")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type', '')
            data = json.loads(text_data)
            if data.get('action') == 'wsUpdateSelections':
                selections = data.get('selections')
                if self.channel_layer:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "broadcast_update",
                            "selections": selections,
                            "sender": self.channel_name,
                        }
                    )
                else:
                    logger.warning("Channel layer not available, cannot broadcast update")
            elif message_type == 'refetch_matchup':
                await self.send(text_data=json.dumps({
                    'type': 'refetch_matchup',
                    'message': 'Matchup has been updated. Please refresh.',
                }))
        except Exception as e:
            logger.error(f"Error in WebSocket receive for matchup {self.matchup_id}: {e}", exc_info=True)

    async def broadcast_update(self, event):
        try:
            if event.get("sender") != self.channel_name:
                await self.send(text_data=json.dumps({
                    "type": "refetch_selections"
                }))
        except Exception as e:
            logger.error(f"Error broadcasting update for matchup {self.matchup_id}: {e}")

    async def refetch_matchup(self, event):
        await self.send(text_data=json.dumps({
            'type': 'refetch_matchup',
            'message': event.get('message', 'Matchup data has been refreshed'),
        }))
