import argparse
import free_test
import dep

def main():
    args = parse_args()
    numbers: list[int] = [int(n) for n in args.numbers]
    inorder = sorted(numbers)
    print(inorder)
    dep.awww()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("numbers", nargs="*")
    return parser.parse_args()

if __name__ == "__main__":
    main()
