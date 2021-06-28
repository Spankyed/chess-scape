//set initial state here
export const chatState = {
  chatting: false,
  //typing: true,
  character: {},
  empty: true,
  messages: [],
  error: null
};


export const chatActions = {
  showChat: (char) => () => ({ chatting: true, character: char.name }),
  hideChat: () => () => ({ chatting: false, empty: true}),  
  sendMessage: message => state => ({messages: [...state.messages, message], empty: false}),
  empty: () => () => ({messages: [], empty: true}),
  error: error => () => ({ empty: false, error })
};