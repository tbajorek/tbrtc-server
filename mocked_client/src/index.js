import UserCreator from './UserCreator';
import UserNormal from './UserNormal';

const registry = {};
const url = 'ws://localhost:9876';
let normal1;
let normal2;

let __CASE__ = 0;
process.argv.forEach(function (val, index, array) {
    if(val === '--case') {
        __CASE__ = parseInt(array[index+1]);
    }
});
console.log('selected case: ' + __CASE__);
switch (__CASE__) {
    // utworzenie nowej sesji, dołączenie do niej dwóch użytkowników, a następnie opuszczenie jej przez obydwu
    case 1: {
        const creator = new UserCreator(url, registry, 0);
        creator.on('session.new', () => {
            normal1 = new UserNormal(url, registry, 1);
            normal1.on('session.data', () => {
                normal2 = new UserNormal(url, registry, 2);
                normal2.on('session.data', () => {
                    normal1.doLater(() => {
                        normal1.send(normal1.leaveSessionMsg());
                        creator.doLater(() => {
                            creator.send(creator.leaveSessionMsg());
                        }, 5000);
                    });
                });
            });
        });
    }
    break;
    // żądanie utworzenia nowej sesji orazdołączenie do niej
    case 2: {
        const creator = new UserCreator(url, registry, 0);
        creator.on('session.new', () => {
            normal1 = new UserNormal(url, registry, 1);
            normal1.on('session.data', () => {
                normal1.ws.close();
            });
        });
    }
    break;
    // żądanie utworzenia nowej sesji
    case 3: {
        const creator = new UserCreator(url, registry, 0);
        creator.rejected(true);
        creator.on('session.new', () => {
            normal1 = new UserNormal(url, registry, 1);
        });
    }
    break;
}
