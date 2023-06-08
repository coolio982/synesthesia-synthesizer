// import React, { useState, useEffect, useContext, ReactNode } from 'react';
// import socketIOClient, { Socket } from 'socket.io-client';

// interface Message {
//   coordinates: {
//     x: number;
//     y: number;
//   };
// }

// interface SpawnElementProps {
//   x: number;
//   y: number;
//   children: ReactNode;
// }

// const SpawnElementContext = React.createContext<Message[]>([]);

// const SpawnElement = ({ x, y, children: ElementComponent }: SpawnElementProps) => {
//   const [style, setStyle] = useState({ Position: 'absolute', left: x, top: y });

//   useEffect(() => {
//     setStyle({ Position: 'absolute', left: x, top: y });
//   }, [x, y]);

//   return <div style={style}>{ElementComponent}</div>;
// };

// const SpawnElementProvider: React.FC = ({ children }) => {
//   const [elements, setElements] = useState<Message[]>([]);
//   const [socket, setSocket] = useState<Socket | null>(null);

//   useEffect(() => {
//     const newSocket = socketIOClient("http://localhost:4001");
//     setSocket(newSocket);

//     return () => newSocket.disconnect();
//   }, []);

//   useEffect(() => {
//     if (socket) {
//       socket.on("newMessage", (message: Message) => {
//         setElements(prev => [...prev, message]);
//       });
//     }
//   }, [socket]);

//   return (
//     <SpawnElementContext.Provider value={elements}>
//       {children}
//       {elements.map((element, index) => (
//         <SpawnElement key={index} x={element.coordinates.x} y={element.coordinates.y}>
//           <p>The spawned element!</p>
//         </SpawnElement>
//       ))}
//     </SpawnElementContext.Provider>
//   );
// };

// export { SpawnElementProvider, SpawnElement };
