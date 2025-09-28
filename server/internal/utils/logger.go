package utils

import "go.uber.org/zap"

func NewLogger() (*zap.Logger, func(), error) {
	lg, err := zap.NewProduction()
	if err != nil {
		return nil, nil, err
	}
	cleanup := func() { _ = lg.Sync() }
	return lg, cleanup, nil
}
