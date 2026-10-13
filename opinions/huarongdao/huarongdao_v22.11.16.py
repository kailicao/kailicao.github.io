from timeit import default_timer as timer
start_time = timer()
elapsed_time = lambda: timer() - start_time

from itertools import combinations
from math import comb

from queue import Queue
from sys import exit
import cv2
import os

import matplotlib.pyplot as plt
from matplotlib import rcParams
rcParams.update({'font.family' : 'serif', 'mathtext.fontset' : 'dejavuserif',
                 'font.size' : 12, 'text.latex.preamble' : r"\usepackage{amsmath}",
                 'xtick.major.pad' : 2, 'ytick.major.pad' : 2, 'xtick.major.size' : 6, 'ytick.major.size' : 6,
                 'xtick.minor.size' : 3, 'ytick.minor.size' : 3, 'axes.linewidth' : 2, 'axes.labelpad' : 1})
from matplotlib.patches import FancyBboxPatch, BoxStyle


def count_possible_configs():
    ctr = 0
    
    for generals in combinations(range(4, 20), 4):
        occupied = [general + shift for general in generals for shift in [0, -4]]
        if len(set(occupied)) < 8: continue
    
        for Caocao in range(4, 20):
            if Caocao % 4 == 3: continue
            occupied1 = occupied + [Caocao + shift for shift in [0, 1, -4, -3]]
            if len(set(occupied1)) < 12: continue
    
            for Guanyu in range(20):
                if Guanyu % 4 == 3: continue
                occupied2 = occupied1 + [Guanyu, Guanyu + 1]
                if len(set(occupied2)) < 14: continue
                ctr += 1
    
    ctr *= comb(6, 4)
    print(ctr)  # 65880


class Board():
    def __init__(self, width: int=4, height: int=5):
        self.width = width
        self.height = height


    def __del__(self):
        self.__dict__.clear()


    def __getCol(self, coord: int) -> int:
        return coord % self.width


    def __getRow(self, coord: int) -> int:
        return coord // self.width


    def getColRow(self, coord: int) -> (int, int):
        return self.__getCol(coord), self.__getRow(coord)


    # def __getLeft(self, coord: int, shift: int=1):
    #     col = self.__getCol(coord)
    #     if col < shift: return -1
    #     return coord - shift


    # def __getRight(self, coord: int, shift: int=1):
    #     col = self.__getCol(coord)
    #     if col >= self.width - shift: return -1
    #     return coord + shift


    # def __getUp(self, coord: int, shift: int=1):
    #     row = self.__getRow(coord)
    #     if row >= self.height - shift: return -1
    #     return coord + shift * self.width


    # def __getDown(self, coord: int, shift: int=1):
    #     row = self.__getRow(coord)
    #     if row < shift: return -1
    #     return coord - shift * self.width


    def getNeighbor(self, coord: int, hshift: int=0, vshift: int=0) -> int:
        col, row = self.getColRow(coord)
        col += hshift; row += vshift

        if not 0 <= col < self.width: return -1
        if not 0 <= row < self.height: return -1

        return row * self.width + col


    def getVicinity(self, coord: int) -> dict:
        vicinity = {}

        for hshift in [-2, -1, 1, 2]:
            vicinity[(hshift, 0)] = self.getNeighbor(coord, hshift=hshift)
        for vshift in [-2, -1, 1, 2]:
            vicinity[(0, vshift)] = self.getNeighbor(coord, vshift=vshift)

        return vicinity


    def getVicinity2(self, coords: (int, int)) -> (str, dict):
        coord1, coord2 = coords
        adjacent = ''
        if coord1 == self.getNeighbor(coord2, hshift=-1):
            adjacent = 'H'
        elif coord1 == self.getNeighbor(coord2, vshift=-1):
            adjacent = 'V'

        vicinity = {}

        for shift, coord in self.getVicinity(coord1).items():
            vicinity[(1,) + shift] = coord
        for shift, coord in self.getVicinity(coord2).items():
            vicinity[(2,) + shift] = coord

        if adjacent == 'H':
            for key in [(2, -2, 0), (2, -1, 0), (1, 1, 0), (1, 2, 0)]:
                vicinity[key] = -1
        elif adjacent == 'V':
            for key in [(2, 0, -2), (2, 0, -1), (1, 0, 1), (1, 0, 2)]:
                vicinity[key] = -1

        return adjacent, vicinity


def test_Board_methods():
    board = Board()

    for coord in range(20):
        print(coord, board.getVicinity(coord))

    print(board.getVicinity2((6, 10)))


class Config():
    def __init__(self, board: Board, coords: (int, tuple, tuple, tuple, tuple)\
                 =(17, (9,), (8, 11, 16, 19), (0, 3, 5, 6), (1, 2))):
        self.__board     =      board
        self.__Caocao    =      coords[0]
        self.__HGenerals = list(coords[1])
        self.__VGenerals = list(coords[2])
        self.__Soldiers  = list(coords[3])
        self.__Vacancies = list(coords[4])


    def __del__(self):
        self.__dict__.clear()


    def display(self, figname: str):
        fig, ax = plt.subplots(figsize=(self.__board.width + 0.1,
                                        self.__board.height))

        x, y = self.__board.getColRow(self.__Caocao)
        ax.add_artist(FancyBboxPatch([x + 0.1, y - 0.9], 1.8, 1.8,
            boxstyle=BoxStyle("Round", pad=0.05), color='tab:blue', alpha=0.7))
        ax.text(x + 1.0, y - 0.05, figname, ha='center', va='center',
                color='tab:blue', fontsize=36)

        for Hgeneral in self.__HGenerals:
            x, y = self.__board.getColRow(Hgeneral)
            ax.add_artist(FancyBboxPatch([x + 0.1, y + 0.1], 1.8, 0.8,
                boxstyle=BoxStyle("Round", pad=0.05), color='tab:red', alpha=0.7))

        for Vgeneral in self.__VGenerals:
            x, y = self.__board.getColRow(Vgeneral)
            ax.add_artist(FancyBboxPatch([x + 0.1, y - 0.9], 0.8, 1.8,
                boxstyle=BoxStyle("Round", pad=0.05), color='tab:orange', alpha=0.7))

        for soldier in self.__Soldiers:
            x, y = self.__board.getColRow(soldier)
            ax.add_artist(FancyBboxPatch([x + 0.1, y + 0.1], 0.8, 0.8,
                boxstyle=BoxStyle("Round", pad=0.05), color='tab:green', alpha=0.7))


        ax.axis('equal'); ax.axis('off')
        ax.set_xlim((-0.1, 4.1)); ax.set_xticks([])
        ax.set_ylim((-0.0, 5.0)); ax.set_yticks([])
        ax.patch.set_alpha(0.0)

        fig.tight_layout()
        fig.savefig(f'{figname}.png', dpi=128)
        plt.close(fig)


    def __moveCaocao(self, shift: (int, int)):
        new_Caocao = self.__board.getNeighbor(self.__Caocao, *shift)

        if shift == (1, 0):
            new_vacancies = (self.__board.getNeighbor(self.__Caocao, vshift=-1),
                             self.__Caocao)
        elif shift == (-1, 0):
            new_vacancies = (self.__board.getNeighbor(self.__Caocao, hshift=1, vshift=-1),
                             self.__board.getNeighbor(self.__Caocao, hshift=1))
        elif shift == (0, -1):
            new_vacancies = (self.__Caocao,
                             self.__board.getNeighbor(self.__Caocao, hshift=1))
        elif shift == (0, 1):
            new_vacancies = (self.__board.getNeighbor(self.__Caocao, vshift=-1),
                             self.__board.getNeighbor(self.__Caocao, hshift=1, vshift=-1))

        coords = (new_Caocao, tuple(self.__HGenerals), tuple(self.__VGenerals),
                  tuple(self.__Soldiers), new_vacancies)
        self.__Neighbors.append(coords)


    @staticmethod
    def list_replace(array: list, old: int, new: int):
        array[array.index(old)] = new
        array.sort()


    def __moveHGeneral(self, old_coord: int, shift: (int, int)):
        new_HGenerals = self.__HGenerals.copy()
        Config.list_replace(new_HGenerals, old_coord,
                            self.__board.getNeighbor(old_coord, *shift))

        if shift == (1, 0):
            new_vacancies = self.__Vacancies.copy()
            Config.list_replace(new_vacancies,
                                self.__board.getNeighbor(old_coord, hshift=2),
                                old_coord)
        elif shift == (-1, 0):
            new_vacancies = self.__Vacancies.copy()
            Config.list_replace(new_vacancies,
                                self.__board.getNeighbor(old_coord, hshift=-1),
                                self.__board.getNeighbor(old_coord, hshift=1))
        else:
            new_vacancies = (old_coord,
                             self.__board.getNeighbor(old_coord, hshift=1))

        coords = (self.__Caocao, tuple(new_HGenerals), tuple(self.__VGenerals),
                  tuple(self.__Soldiers), tuple(sorted(new_vacancies)))
        self.__Neighbors.append(coords)


    def __moveVGeneral(self, old_coord: int, shift: (int, int)):
        new_VGenerals = self.__VGenerals.copy()
        Config.list_replace(new_VGenerals, old_coord,
                            self.__board.getNeighbor(old_coord, *shift))

        if shift == (0, 1):
            new_vacancies = self.__Vacancies.copy()
            Config.list_replace(new_vacancies,
                                self.__board.getNeighbor(old_coord, vshift=1),
                                self.__board.getNeighbor(old_coord, vshift=-1))
        elif shift == (0, -1):
            new_vacancies = self.__Vacancies.copy()
            Config.list_replace(new_vacancies,
                                self.__board.getNeighbor(old_coord, vshift=-2),
                                old_coord)
        else:
            new_vacancies = [old_coord,
                             self.__board.getNeighbor(old_coord, vshift=-1)]
            new_vacancies.sort()

        coords = (self.__Caocao, tuple(self.__HGenerals), tuple(new_VGenerals),
                  tuple(self.__Soldiers), tuple(new_vacancies))
        self.__Neighbors.append(coords)


    def __moveSoldier(self, old_coord: int, new_coord: int):
        new_Soldiers = self.__Soldiers.copy()
        Config.list_replace(new_Soldiers, old_coord, new_coord)

        new_vacancies = self.__Vacancies.copy()
        Config.list_replace(new_vacancies, new_coord, old_coord)

        coords = (self.__Caocao, tuple(self.__HGenerals), tuple(self.__VGenerals),
                  tuple(new_Soldiers), tuple(new_vacancies))
        self.__Neighbors.append(coords)


    def getNeighbors(self, allow_twice: bool=True):
        if '__Neighbors' in self.__dict__:
            return self.__Neighbors

        self.__Neighbors = []
        adjacent, vicinity = self.__board.getVicinity2(self.__Vacancies)
        vacancy1, vacancy2 = self.__Vacancies

        # try to move Caocao
        if adjacent == 'V':
            if vicinity[(2, -2, 0)] == self.__Caocao:
                self.__moveCaocao((1, 0))
            elif vicinity[(2, 1, 0)] == self.__Caocao:
                self.__moveCaocao((-1, 0))

        elif adjacent == 'H':
            if vicinity[(1, 0, 2)] == self.__Caocao:
                self.__moveCaocao((0, -1))
            elif vicinity[(1, 0, -1)] == self.__Caocao:
                self.__moveCaocao((0, 1))

        # try to move an HGeneral
        for v in [1, 2]:
            if vicinity[(v, -2, 0)] in self.__HGenerals:
                self.__moveHGeneral(vicinity[(v, -2, 0)], (1, 0))
            if vicinity[(v, 1, 0)] in self.__HGenerals:
                self.__moveHGeneral(vicinity[(v, 1, 0)], (-1, 0))

        if adjacent == 'H':
            if vicinity[(1, 0, 1)] in self.__HGenerals:
                self.__moveHGeneral(vicinity[(1, 0, 1)], (0, -1))
            if vicinity[(1, 0, -1)] in self.__HGenerals:
                self.__moveHGeneral(vicinity[(1, 0, -1)], (0, 1))

            if allow_twice:
                if vicinity[(1, -2, 0)] in self.__HGenerals:
                    self.__moveHGeneral(vicinity[(1, -2, 0)], (2, 0))
                if vicinity[(2, 1, 0)] in self.__HGenerals:
                    self.__moveHGeneral(vicinity[(2, 1, 0)], (-2, 0))

        # try to move a VGeneral
        for v in [1, 2]:
            if vicinity[(v, 0, -1)] in self.__VGenerals:
                self.__moveVGeneral(vicinity[(v, 0, -1)], (0, 1))
            if vicinity[(v, 0, 2)] in self.__VGenerals:
                self.__moveVGeneral(vicinity[(v, 0, 2)], (0, -1))

        if adjacent == 'V':
            if vicinity[(2, -1, 0)] in self.__VGenerals:
                self.__moveVGeneral(vicinity[(2, -1, 0)], (1, 0))
            if vicinity[(2, 1, 0)] in self.__VGenerals:
                self.__moveVGeneral(vicinity[(2, 1, 0)], (-1, 0))

            if allow_twice:
                if vicinity[(1, 0, -1)] in self.__VGenerals:
                    self.__moveVGeneral(vicinity[(1, 0, -1)], (0, 2))
                if vicinity[(2, 0, 2)] in self.__VGenerals:
                    self.__moveVGeneral(vicinity[(2, 0, 2)], (0, -2))

        # try to move a Soldier
        for v, vacancy in enumerate(self.__Vacancies, start=1):
            for shift in [(1, 0), (-1, 0), (0, -1), (0, 1)]:
                old_coord = vicinity[(v,) + shift]
                if old_coord in self.__Soldiers:
                    self.__moveSoldier(old_coord, vacancy)
                    if allow_twice and adjacent:
                        self.__moveSoldier(old_coord, sum(self.__Vacancies) - vacancy)

        return self.__Neighbors


def test_Config_methods():
    board = Board()
    # init_coords = (17, (9,), (8, 11, 16, 19), (0, 3, 5, 6), (1, 2))
    init_coords = (17, (9,), (4, 6, 16, 19), (1, 3, 5, 11), (7, 8))
    config = Config(board, init_coords)
    config.display('0')

    neighbors = config.getNeighbors()
    del config

    for i, neighbor in enumerate(neighbors, start=1):
        print(i, neighbor)
        config = Config(board, neighbor)
        config.display(repr(i))
        del config

    del board


class Solution():
    def __init__(self, board: Board, init_coords: (int, tuple, tuple, tuple, tuple)=\
                 (17, (9,), (8, 11, 16, 19), (0, 3, 5, 6), (1, 2)),
                 max_nsteps: int=100000, allow_twice: bool=True):
        self.board = board
        self.init_coords = init_coords
        self.max_nsteps = max_nsteps
        self.allow_twice = allow_twice

        validity_check = [self.board.getNeighbor(init_coords[0], *shift)
                          for shift in [(0, 0), (1, 0), (0, -1), (1, -1)]]
        for i in range(1, 5):
            for coord in init_coords[i]:
                validity_check.append(coord)
                if i == 1: validity_check.append(self.board.getNeighbor(coord, hshift=1))
                if i == 2: validity_check.append(self.board.getNeighbor(coord, vshift=-1))
        validity_check.sort()
        if validity_check != list(range(self.board.width * self.board.height)):
            print(f' > Warning: Config({init_coords}) is invalid')


    def __del__(self):
        self.__dict__.clear()


    def __find_path(self):
        self.__coords_dict = {self.init_coords: None}
        self.__coords_queue = Queue()
        self.__coords_queue.put(self.init_coords)
        self.final_coords = None

        for i in range(self.max_nsteps):
            coords = self.__coords_queue.get()
            if i % 1000 == 0: print(i, coords)

            if coords[0] == 5:
                print(i, coords)
                self.final_coords = coords
                del self.__coords_queue
                break

            config = Config(self.board, coords)
            # config.display(repr(i))
            # print(i, coords, self.__coords_dict[coords])

            neighbors = config.getNeighbors(allow_twice=self.allow_twice)
            for neighbor in neighbors:
                if neighbor in self.__coords_dict: continue
                self.__coords_dict[neighbor] = coords
                self.__coords_queue.put(neighbor)
            del config

            if self.__coords_queue.empty():
                self.final_coords = coords
                break

        self.path = []
        if self.final_coords is not None:
            coords = self.final_coords
            while coords:
                self.path.append(coords)
                coords = self.__coords_dict[coords]
            self.path.reverse()
        self.__coords_dict.clear()


    def __display(self):
        print(' > Visualizing', '@', elapsed_time())

        images = []
        for i, coords in enumerate(self.path):
            print(i, coords)
            config = Config(self.board, coords)
            config.display(repr(i))
            images.append(f'{i}.png')
            del config

        frame = cv2.imread(images[0])
        height, width, layers = frame.shape
        video = cv2.VideoWriter('huarongdao.mp4', 0, 5, (width, height))

        for image in images:
            video.write(cv2.imread(image))
            os.remove(image)

        cv2.destroyAllWindows()
        video.release()


    def __call__(self):
        self.__find_path()
        if self.path: self.__display()


if __name__ == "__main__":
    # count_possible_configs()
    # test_Board_methods()
    # test_Config_methods()

    board = Board()
    solution = Solution(board,
                        # init_coords=(17, (1, 5, 9), (11, 19), (4, 8, 12, 16), (0, 3)),
                        allow_twice=True)
    solution()
    del solution

    print(' > Finished!', '@', elapsed_time())

